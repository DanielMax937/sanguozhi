#!/usr/bin/env python3
"""Compare the public patrol listing's x86 bytes with the real engine export.

This is a restricted instruction interpreter, not a game emulator. The original
helper bodies are replaced by explicit stable observations; no executable or
restored machine code is run. Expected arithmetic is derived only by decoding
the authenticated UTF-8 listing's bytes, never by importing production constants
or evaluating a closed-form patrol formula. The separately headed MOD is parsed
and checked in its own instruction map and is never overlaid on the original.

By default, run native-entry/branch/normalization examples and compare supported
examples with the production export. Add --sweep for all 392192 combinations of
sum 0..765, city byte 0..255, and helper EAX zero/nonzero. That sweep executes the
original arithmetic slice after independently checking the native prefix and its
stable slot projection. --output writes the report only when explicitly supplied.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
import subprocess
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROFILE = "patrol-security-gain-stable-v1"
SOURCE_BLOB = "71b6c28bdc4c3d0f591d0af5ee813c8fb9f4134a"
SOURCE_UTF8_SHA256 = "3989a39a14e15d83c6f8ed7ef5b057a3fed92441c26ff3cc3ec60c0a08e6d52a"
SOURCE_GBK_SHA256 = "8f6c8f52f13c83804629202238e0db60c0e9f048c4b891501050c618ba9fc315"
NATIVE_SHA256 = "57471a89512c477dadcab409565d8b38fcb428963e894f828972714d87687543"
MOD_SHA256 = "4a39ecdd13e7d2e72465ff60113b4a717810bc40c724822472fd6efebeaa8f50"
MASK32 = (1 << 32) - 1
RECORD = struct.Struct("<3BHiii??")
FIELDS = ("normalizedLeadershipSlots", "sumLeadership", "baseGain", "afterPressure",
          "returnedDelta", "pressureApplied", "capBranch")


def signed(value: int, bits: int = 32) -> int:
    value &= (1 << bits) - 1
    return value - (1 << bits) if value & (1 << (bits - 1)) else value


@dataclass(frozen=True)
class Listing:
    original: dict[int, bytes]
    mod: dict[int, bytes]


def load_listing(path: Path | None = None) -> Listing:
    snapshot = path or ROOT / "docs/sources/patrol-security-gain-original.txt"
    utf8 = snapshot.read_bytes()
    if len(utf8) != 7013 or hashlib.sha256(utf8).hexdigest() != SOURCE_UTF8_SHA256:
        raise ValueError("unexpected UTF-8 source snapshot identity")
    text = utf8.decode("utf-8")
    gbk = text.encode("gbk")
    blob = hashlib.sha1(b"blob " + str(len(gbk)).encode() + b"\0" + gbk).hexdigest()
    if (len(gbk) != 6637 or blob != SOURCE_BLOB
            or hashlib.sha256(gbk).hexdigest() != SOURCE_GBK_SHA256
            or gbk.decode("gbk").encode("utf-8") != utf8):
        raise ValueError("source is not the reversible, fixed-blob GBK evidence")
    sections = text.split("修改 - 巡查倍率可调整")
    if len(sections) != 2:
        raise ValueError("original/MOD separator changed")
    # Anchoring excludes the four indented call-site examples above the function.
    pattern = re.compile(r"^([0-9A-F]{8}) - ((?:[0-9a-f]{2} ?)+)\s+- (.*)$", re.M)
    maps = []
    for section, start, end, count, size, digest in (
            (sections[0], 0x005CBA10, 0x005CBADC, 79, 204, NATIVE_SHA256),
            (sections[1], 0x005CBA83, 0x005CBA98, 7, 21, MOD_SHA256)):
        rows = [(int(a, 16), bytes.fromhex(b), asm) for a, b, asm in pattern.findall(section)]
        pc = start
        for address, data, _ in rows:
            if address != pc:
                raise ValueError(f"instruction gap or duplicate at {address:08X}, expected {pc:08X}")
            pc += len(data)
        code = b"".join(data for _, data, _ in rows)
        if (pc != end or len(rows) != count or len(code) != size
                or hashlib.sha256(code).hexdigest() != digest):
            raise ValueError("unexpected instruction range/count/bytes/hash")
        instruction_map = {a: b for a, b, _ in rows}
        for address, data, asm in rows:
            target = None
            if data[0] == 0xE8:
                target = address + 5 + int.from_bytes(data[1:], "little", signed=True)
                if target != int(asm.split()[1], 16):
                    raise ValueError("relative CALL disagrees with listing target")
            elif data[0] in (0x74, 0x7C, 0x7E):
                target = address + 2 + signed(data[1], 8)
            elif data[:2] == b"\x0f\x84":
                target = address + 6 + int.from_bytes(data[2:], "little", signed=True)
            if target is not None and data[0] != 0xE8 and target not in instruction_map:
                raise ValueError("branch does not land on an original instruction boundary")
        maps.append(instruction_map)
    original, mod = maps
    # Preserve the source typo; C1 FA is the 32-bit SAR EDX opcode, not SAR DL.
    if original[0x005CBA90] != bytes.fromhex("c1 fa 04") or "sar dl,04" not in sections[0]:
        raise ValueError("expected byte-versus-mnemonic discrepancy is absent")
    if original[0x005CBA83] == mod[0x005CBA83] or 0x005CBA89 in original:
        raise ValueError("MOD instructions leaked into the original map")
    return Listing(original, mod)


class OriginalMachine:
    """Restricted x86 interpreter with explicit stable opaque-pointer stubs.

    Validity, resolved getter AL, city byte and pressure EAX are supplied facts.
    Calls and memory reads outside these exact boundaries fail closed. Full-entry
    execution checks native gates and the three-slot loop. Arithmetic-only entry
    models the register/stack state at 005CBA87 for the exhaustive sum projection.
    """

    STACK = 0x00100000
    FACILITY = 0x00200000
    SLOTS = 0x00300000
    CITY = 0x00400000

    def __init__(self, instructions: dict[int, bytes], slots: list[int | None], order: int,
                 helper: int, *, facility_valid: bool = True, city_valid: bool = True,
                 arithmetic_sum: int | None = None):
        if (len(slots) > 3 or any(v is not None and (type(v) is not int or not 0 <= v <= 255)
                                  for v in slots)):
            raise ValueError("native observations require at most three uint8-or-null slots")
        if type(order) is not int or not 0 <= order <= 255:
            raise ValueError("native order read must be uint8")
        if type(helper) is not int or not 0 <= helper <= MASK32:
            raise ValueError("pressure helper observation must be uint32")
        self.instructions = instructions
        self.r = [0, 0, 0, 0, self.STACK, 0, 0, 0]
        self.memory: dict[int, int] = {}
        self.people = {}
        self.validity = {self.FACILITY: facility_valid, self.CITY: city_valid, 0: False}
        self.result = {"pressureApplied": False, "capBranch": False}
        self.pc = 0x005CBA10
        self.comparison = 0
        self.helper = helper
        self.gates = []
        self.getter_calls = 0
        self.city_getter_calls = 0
        self.pressure_calls = 0
        self.city_reads = 0
        self.slot_checks = 0
        self.write_memory(self.STACK, 0xDEADC0DE, 4)
        self.write_memory(self.STACK + 4, self.FACILITY, 4)
        self.write_memory(self.STACK + 8, self.SLOTS, 4)
        normalized = slots + [None] * (3 - len(slots))
        for slot, value in enumerate(normalized):
            pointer = 0 if value is None else 0x00500000 + slot * 16
            self.write_memory(self.SLOTS + slot * 4, pointer, 4)
            if value is not None:
                self.people[pointer] = value
                self.validity[pointer] = True
        self.write_memory(self.CITY + 0x85, order, 1)
        if arithmetic_sum is not None:
            if type(arithmetic_sum) is not int or not 0 <= arithmetic_sum <= 765:
                raise ValueError("sum must be in the three-uint8 range")
            self.pc = 0x005CBA87
            self.r[3] = arithmetic_sum
            self.r[1] = self.FACILITY
            self.r[4] = self.STACK - 20
            for address in range(self.STACK - 20, self.STACK, 4):
                self.write_memory(address, 0, 4)
            # The original city's scratch slot overwrites saved ECX at entry-4.
            self.write_memory(self.STACK - 4, self.CITY, 4)
            self.result["sumLeadership"] = arithmetic_sum

    def read_memory(self, address: int, width: int) -> int:
        if address == self.CITY + 0x85:
            if width != 1:
                raise AssertionError("city order was not read as uint8")
            self.city_reads += 1
        # Uninitialized memory is not silently accepted as a zero observation.
        return sum(self.memory[address + i] << (8 * i) for i in range(width))

    def write_memory(self, address: int, value: int, width: int):
        for i in range(width):
            self.memory[address + i] = (value >> (8 * i)) & 255

    def read(self, operand, width=4):
        kind, index = operand
        return self.r[index] & ((1 << (width * 8)) - 1) if kind == "r" else self.read_memory(index, width)

    def write(self, operand, value, width=4):
        kind, index = operand
        mask = (1 << (width * 8)) - 1
        if kind == "r":
            self.r[index] = ((self.r[index] & ~mask) | (value & mask)) & MASK32
        else:
            self.write_memory(index, value, width)

    def modrm(self, data, offset=1):
        byte = data[offset]
        offset += 1
        mode, reg, rm = byte >> 6, (byte >> 3) & 7, byte & 7
        if mode == 3:
            return ("r", reg), ("r", rm), offset
        if rm == 4:
            sib = data[offset]
            offset += 1
            scale, index, base = sib >> 6, (sib >> 3) & 7, sib & 7
            address = self.r[base] + (0 if index == 4 else self.r[index] * (1 << scale))
        else:
            address = self.r[rm]
        if mode == 1:
            address += signed(data[offset], 8)
            offset += 1
        elif mode == 2:
            address += int.from_bytes(data[offset:offset + 4], "little", signed=True)
            offset += 4
        elif mode == 0 and rm == 5:
            raise ValueError("absolute ModRM is outside this instruction profile")
        return ("r", reg), ("m", address & MASK32), offset

    def call(self, target: int, pc: int):
        if target == 0x0047A630:
            pointer = self.read_memory(self.r[4], 4)
            self.r[0] = int(self.validity[pointer])
            if pc == 0x005CBA65:
                self.slot_checks += 1
            else:
                label = {0x005CBA18: "facility", 0x005CBA30: "first-officer", 0x005CBA4C: "city"}[pc]
                self.gates.append({"gate": label, "passed": bool(self.r[0])})
        elif target == 0x004866F0:
            if self.r[1] != self.FACILITY:
                raise AssertionError("city resolver received wrong opaque facility")
            self.r[0] = self.CITY
            self.city_getter_calls += 1
        elif target == 0x00489070:
            # Deliberately dirty the upper bits: the original MOVZX must read AL.
            self.r[0] = 0xA5A50000 | self.people[self.r[1]]
            self.getter_calls += 1
        elif target == 0x004B99B0:
            if self.read_memory(self.r[4], 4) != self.FACILITY or self.r[1] != 0x0799895C:
                raise AssertionError("pressure helper boundary arguments changed")
            self.r[0] = self.helper
            self.r[4] += 4  # observed callee cleanup required by the original stack
            self.pressure_calls += 1
        else:
            raise ValueError(f"unrecognized original call {target:08X}")

    def run(self):
        for _ in range(256):
            pc = self.pc
            data = self.instructions[pc]
            next_pc = pc + len(data)
            opcode = data[0]
            if 0x50 <= opcode <= 0x57:
                self.r[4] -= 4
                self.write_memory(self.r[4], self.r[opcode - 0x50], 4)
            elif 0x58 <= opcode <= 0x5F:
                self.r[opcode - 0x58] = self.read_memory(self.r[4], 4)
                self.r[4] += 4
            elif opcode in (0x33, 0x31, 0x89, 0x8B, 0x85, 0x03, 0x2B, 0x8D):
                reg, rm, _ = self.modrm(data)
                if opcode == 0x8D:
                    if rm[0] != "m":
                        raise ValueError("LEA requires an address operand")
                    self.write(reg, rm[1])
                else:
                    a, b = self.read(reg), self.read(rm)
                    if opcode == 0x33:
                        self.write(reg, a ^ b)
                        self.comparison = signed(a ^ b)
                    elif opcode == 0x31:
                        self.write(rm, a ^ b)
                        self.comparison = signed(a ^ b)
                    elif opcode == 0x89:
                        self.write(rm, a)
                    elif opcode == 0x8B:
                        self.write(reg, b)
                    elif opcode == 0x85:
                        self.comparison = signed(a & b)
                    elif opcode == 0x03:
                        self.write(reg, a + b)
                    elif opcode == 0x2B:
                        self.write(reg, a - b)
            elif opcode == 0x83:
                operation, operand, offset = self.modrm(data)
                immediate = signed(data[offset], 8)
                if operation[1] == 0:
                    self.write(operand, self.read(operand) + immediate)
                elif operation[1] == 7:
                    self.comparison = signed(self.read(operand)) - immediate
                else:
                    raise ValueError("unsupported immediate operation")
            elif opcode in (0x74, 0x7C, 0x7E):
                take = {0x74: self.comparison == 0, 0x7C: self.comparison < 0,
                        0x7E: self.comparison <= 0}[opcode]
                if take:
                    next_pc += signed(data[1], 8)
                if pc == 0x005CBAAB:
                    self.result["pressureApplied"] = not take
                elif pc == 0x005CBAC7:
                    self.result["capBranch"] = not take
            elif opcode == 0x0F:
                if data[1] == 0x84:
                    if self.comparison == 0:
                        next_pc += int.from_bytes(data[2:], "little", signed=True)
                elif data[1] == 0xB6:
                    reg, rm, _ = self.modrm(data, 2)
                    self.write(reg, self.read(rm, 1))
                else:
                    raise ValueError("unsupported extended opcode")
            elif opcode == 0xE8:
                self.call(next_pc + int.from_bytes(data[1:], "little", signed=True), pc)
            elif opcode == 0x47:
                self.r[7] = (self.r[7] + 1) & MASK32
            elif 0xB8 <= opcode <= 0xBF:
                self.r[opcode - 0xB8] = int.from_bytes(data[1:], "little")
            elif opcode == 0x99:
                self.r[2] = MASK32 if signed(self.r[0]) < 0 else 0
            elif opcode in (0xD1, 0xC1):
                operation, operand, offset = self.modrm(data)
                shift = 1 if opcode == 0xD1 else data[offset] & 31
                value = self.read(operand)
                if operation[1] == 7:
                    self.write(operand, signed(value) >> shift)
                elif operation[1] == 5:
                    self.write(operand, value >> shift)
                else:
                    raise ValueError("unsupported shift")
            elif opcode == 0xF7:
                operation, operand, _ = self.modrm(data)
                if operation[1] == 5:
                    product = signed(self.r[0]) * signed(self.read(operand))
                    self.r[0], self.r[2] = product & MASK32, (product >> 32) & MASK32
                elif operation[1] == 7:
                    dividend = signed((self.r[2] << 32) | self.r[0], 64)
                    divisor = signed(self.read(operand))
                    quotient = abs(dividend) // abs(divisor)
                    if (dividend < 0) != (divisor < 0):
                        quotient = -quotient
                    self.r[0] = quotient & MASK32
                    self.r[2] = (dividend - quotient * divisor) & MASK32
                else:
                    raise ValueError("unsupported multiplication/division")
            elif opcode == 0x69:
                reg, rm, offset = self.modrm(data)
                self.write(reg, signed(self.read(rm)) * int.from_bytes(data[offset:], "little", signed=True))
            elif opcode == 0x90:
                pass
            elif opcode == 0xC3:
                if self.r[4] != self.STACK or self.read_memory(self.r[4], 4) != 0xDEADC0DE:
                    raise AssertionError("original stack did not balance")
                self.result["returnedDelta"] = signed(self.r[0])
                return self.result
            else:
                raise ValueError(f"unsupported opcode {data.hex()} at {pc:08X}")
            if pc == 0x005CBA83 and opcode == 0x8B:
                self.result["sumLeadership"] = self.r[3]
            elif pc == 0x005CBA9E:
                self.result["baseGain"] = signed(self.r[6])
            elif pc == 0x005CBAB6:
                self.result["afterPressure"] = signed(self.r[6])
            self.pc = next_pc
        raise ValueError("instruction step bound exceeded")


def arithmetic(listing: Listing, total: int, order: int, helper: int):
    return OriginalMachine(listing.original, [0], order, helper, arithmetic_sum=total).run()


def production(cases):
    # Production supplies ACTUAL receipts only, never expected values or oracle constants.
    javascript = """
      import {readFileSync} from 'node:fs';
      import {calculatePatrolSecurityGain as calculate} from './packages/engine/src/index.ts';
      const inputs = JSON.parse(readFileSync(0, 'utf8'));
      process.stdout.write(JSON.stringify(inputs.map(input => calculate(input))));
    """
    completed = subprocess.run(["node", "--input-type=module", "-e", javascript], cwd=ROOT,
                               input=json.dumps(cases), capture_output=True, text=True, check=True)
    return json.loads(completed.stdout)


def check_examples(listing: Listing):
    native_gates = []
    for label, slots, facility, city, expected_labels in (
            ("invalid facility", [100, 100, 100], False, True, ["facility"]),
            ("invalid first officer", [None, 100, 100], True, True, ["facility", "first-officer"]),
            ("invalid city", [100, 100, 100], True, False, ["facility", "first-officer", "city"])):
        machine = OriginalMachine(listing.original, slots, 0, 1, facility_valid=facility, city_valid=city)
        result = machine.run()
        assert result["returnedDelta"] == 0 and "baseGain" not in result, (label, result)
        assert [gate["gate"] for gate in machine.gates] == expected_labels
        assert machine.gates[-1]["passed"] is False
        assert machine.getter_calls == machine.slot_checks == machine.pressure_calls == machine.city_reads == 0
        native_gates.append({"name": label, "returnedDelta": 0, "gateTrace": machine.gates,
                             "leadershipGetterCalls": 0, "pressureHelperCalls": 0, "cityByteReads": 0})

    vectors = [
        ("valid zero first slot; missing tails", [0], 0, 0),
        ("invalid middle is skipped", [0, None, 100], 0, 0),
        ("invalid final is skipped", [0, 100, None], 0, 0),
        ("both tails explicitly absent", [28, None, None], 0, 1),
        ("two present slots; final missing", [27, 1], 0, 1),
        ("valid all-zero slots", [0, 0, 0], 0, 0),
        ("half after plus two", [28], 0, 1),
        ("half before cap", [84], 97, 1),
        ("equality does not take cap", [28], 97, 0),
        ("above 100 returns negative", [0], 101, 0),
        ("raw maximum order", [0], 255, 0),
        ("full uint8 leadership domain", [255, 255, 255], 0, 0),
    ]
    for helper in (2, 0x7FFFFFFF, 0x80000000, 0xFFFFFFFF):
        for slots, order in (([28], 0), ([100, 100, 100], 95), ([255, 255, 255], 255)):
            vectors.append((f"nonzero EAX 0x{helper:08X}", slots, order, helper))
    inputs, expected, traces = [], [], []
    for label, slots, order, helper in vectors:
        machine = OriginalMachine(listing.original, slots, order, helper)
        result = machine.run()
        assert len(machine.gates) == 3 and all(g["passed"] for g in machine.gates)
        assert machine.slot_checks == 3
        assert machine.getter_calls == sum(value is not None for value in slots)
        assert machine.city_getter_calls == machine.pressure_calls == machine.city_reads == 1
        normalized = slots + [None] * (3 - len(slots))
        result["normalizedLeadershipSlots"] = normalized
        sliced = arithmetic(listing, result["sumLeadership"], order, helper)
        assert all(result[key] == sliced[key] for key in FIELDS if key != "normalizedLeadershipSlots")
        inputs.append({"profile": PROFILE, "resolvedLeadershipSlots": slots,
                       "publicOrderByte": order, "pressureHelperEax": helper})
        expected.append(result)
        traces.append({"name": label, "input": inputs[-1], "expected": result,
                       "slotValidityChecks": machine.slot_checks, "leadershipGetterCalls": machine.getter_calls})
    invalid_first = {"profile": PROFILE, "resolvedLeadershipSlots": [None, 100, 100],
                     "publicOrderByte": 0, "pressureHelperEax": 0}
    actual = production(inputs + [invalid_first])
    for trace, want, got in zip(traces, expected, actual[:-1]):
        assert got.get("supported") is True and got.get("profile") == PROFILE, (trace["name"], got)
        assert all(type(got.get(key)) is bool for key in ("pressureApplied", "capBranch"))
        assert all(type(got.get(key)) is int for key in ("sumLeadership", "baseGain", "afterPressure", "returnedDelta"))
        assert {key: got.get(key) for key in FIELDS} == want, (trace["name"], want, got)
    assert actual[-1].get("supported") is False
    assert actual[-1].get("reason") == "invalid-leadership-slots"
    assert "returnedDelta" not in actual[-1], "engineering rejection must not masquerade as native return zero"
    assert expected[0]["baseGain"] == 2 and expected[0]["returnedDelta"] == 2
    assert expected[6]["baseGain"] == 3 and expected[6]["afterPressure"] == 1
    assert expected[7]["returnedDelta"] == 2
    assert expected[8]["returnedDelta"] == 3 and expected[8]["capBranch"] is False
    assert expected[9]["returnedDelta"] == -1 and expected[10]["returnedDelta"] == -155
    assert expected[11]["returnedDelta"] == 29
    return {"nativeEarlyReturnChecks": native_gates, "supportedFullEntryExamples": traces,
            "engineeringFirstNullRejectsInsteadOfNativeZero": True,
            "upperGetterEaxBitsDiscardedByOriginalMovzx": True}


def check_mod(listing: Listing):
    """Execute only the separate seven-instruction patch, then compare its registers.

    This does not substitute the MOD into the original function. EAX+EDX is the
    input to the original shared LEA +2 tail. The displayed multiplier is 100;
    equality at that setting does not certify other settings or stock identity.
    """
    for total in range(766):
        machine = OriginalMachine(listing.mod, [0], 0, 0, arithmetic_sum=total)
        machine.pc = 0x005CBA83
        # The restricted loop has a single exit at the patch's end. Supply an
        # isolated RET sentinel and its own stack, without adding original bytes.
        isolated = dict(listing.mod)
        isolated[0x005CBA98] = b"\xc3"
        machine.instructions = isolated
        machine.r[4] = machine.STACK
        machine.write_memory(machine.STACK + 0x18, machine.FACILITY, 4)
        result = machine.run()
        # Decode the actual shared LEA bytes instead of writing a second +2
        # arithmetic expression or importing the production base-offset value.
        destination, address, _ = machine.modrm(listing.original[0x005CBA9E])
        assert address[0] == "m"
        machine.write(destination, address[1])
        native = arithmetic(listing, total, 0, 0)
        assert signed(machine.r[6]) == native["baseGain"], (total, result, native)
    return {"instructionCount": 7, "byteCount": 21, "sha256": MOD_SHA256,
            "displayedMultiplier": 100, "equivalentSums": 766,
            "overlaidOnOriginal": False, "otherMultipliersCertified": False}


def sweep(listing: Listing):
    # No expected arithmetic appears in this JavaScript. Its bytes are ACTUAL
    # observations of the public engine export, in a fixed documented record.
    javascript = """
      import {calculatePatrolSecurityGain as calculate} from './packages/engine/src/index.ts';
      const bytes = Buffer.alloc(766 * 256 * 2 * 19);
      let at = 0;
      for (let sum = 0; sum <= 765; sum++) {
        const slots = [Math.min(sum, 255), Math.min(Math.max(sum - 255, 0), 255), Math.max(sum - 510, 0)];
        for (let order = 0; order <= 255; order++) {
          for (const helper of [0, 1]) {
            const value = calculate({profile:'patrol-security-gain-stable-v1', resolvedLeadershipSlots:slots,
                                     publicOrderByte:order, pressureHelperEax:helper});
            if (value.supported !== true || value.profile !== 'patrol-security-gain-stable-v1')
              throw new Error('Unexpected rejection/profile: ' + JSON.stringify({sum,order,helper,value}));
            if (!Array.isArray(value.normalizedLeadershipSlots) || value.normalizedLeadershipSlots.length !== 3)
              throw new Error('Invalid normalized slots');
            for (let i = 0; i < 3; i++) {
              if (!Number.isInteger(value.normalizedLeadershipSlots[i])) throw new Error('Non-integer slot');
              bytes.writeUInt8(value.normalizedLeadershipSlots[i], at + i);
            }
            for (const key of ['sumLeadership','baseGain','afterPressure','returnedDelta'])
              if (!Number.isInteger(value[key])) throw new Error('Non-integer receipt ' + key);
            for (const key of ['pressureApplied','capBranch'])
              if (typeof value[key] !== 'boolean') throw new Error('Non-boolean receipt ' + key);
            bytes.writeUInt16LE(value.sumLeadership, at + 3);
            bytes.writeInt32LE(value.baseGain, at + 5);
            bytes.writeInt32LE(value.afterPressure, at + 9);
            bytes.writeInt32LE(value.returnedDelta, at + 13);
            bytes.writeUInt8(Number(value.pressureApplied), at + 17);
            bytes.writeUInt8(Number(value.capBranch), at + 18);
            at += 19;
          }
        }
      }
      if (at !== bytes.length) throw new Error('Unexpected case count');
      process.stdout.write(bytes);
    """
    completed = subprocess.run(["node", "--max-old-space-size=512", "--input-type=module", "-e", javascript],
                               cwd=ROOT, capture_output=True, check=True)
    actual = completed.stdout
    expected_count = 766 * 256 * 2
    if len(actual) != expected_count * RECORD.size:
        raise AssertionError(f"unexpected production result length: {len(actual)}")
    digest, legacy_digest = hashlib.sha256(), hashlib.sha256()
    branches = {"cap": 0, "noCap": 0, "pressure": 0, "noPressure": 0}
    cases = 0
    for total in range(766):
        slots = [min(total, 255), min(max(total - 255, 0), 255), max(total - 510, 0)]
        prefix = OriginalMachine(listing.original, slots, 0, 0)
        full_entry = prefix.run()
        assert full_entry["sumLeadership"] == total
        assert prefix.slot_checks == prefix.getter_calls == 3
        assert full_entry == arithmetic(listing, total, 0, 0)
        for order in range(256):
            for helper in (0, 1):
                want = arithmetic(listing, total, order, helper)
                encoded = RECORD.pack(*slots, want["sumLeadership"], want["baseGain"], want["afterPressure"],
                                      want["returnedDelta"], want["pressureApplied"], want["capBranch"])
                observed = actual[cases * RECORD.size:(cases + 1) * RECORD.size]
                if encoded != observed:
                    raise AssertionError({"sum": total, "order": order, "helperEax": helper,
                                          "expected": RECORD.unpack(encoded), "actual": RECORD.unpack(observed)})
                digest.update(encoded)
                legacy_digest.update(struct.pack("<i??", want["returnedDelta"], want["capBranch"], want["pressureApplied"]))
                branches["cap" if want["capBranch"] else "noCap"] += 1
                branches["pressure" if want["pressureApplied"] else "noPressure"] += 1
                cases += 1
    assert digest.hexdigest() == hashlib.sha256(actual).hexdigest()
    return {"cases": cases, "mismatches": 0, "comparison": "each binary receipt, not only aggregate digest",
            "productionExport": "packages/engine/src/index.ts#calculatePatrolSecurityGain",
            "entry": "005CBA87 after independently checked stable gates/slot resolution",
            "recordOrder": "sum ascending, order ascending, helper 0 then 1",
            "recordLayout": "little-endian <3BHiii??: slots[3], sum, base, afterPressure, delta, pressure, cap",
            "receiptSha256": digest.hexdigest(), "returnedDeltaCapPressureSha256": legacy_digest.hexdigest(),
            "branchCounts": branches, "fullEntryCanonicalSlotSumsChecked": 766,
            "allReceiptFieldsMatch": True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, help="fixed UTF-8 source; defaults to committed source snapshot")
    parser.add_argument("--sweep", action="store_true", help="compare all 392192 numeric-domain cases")
    parser.add_argument("--output", type=Path, help="optional JSON report destination")
    args = parser.parse_args()
    listing = load_listing(args.source)
    result = {"scope": "authenticated source instruction oracle versus actual production export; no game executable",
              "sourceGitBlob": SOURCE_BLOB, "sourceUtf8Sha256": SOURCE_UTF8_SHA256,
              "sourceGbkSha256": SOURCE_GBK_SHA256, "originalInstructionCount": len(listing.original),
              "originalByteCount": sum(map(len, listing.original.values())), "originalBytesSha256": NATIVE_SHA256,
              "byteSarEdxWinsOverSourceSarDlTypo": True,
              "originalPressureHelperInternalsImplemented": False,
              "commandOrWriterOrTpImplemented": False,
              "mod": check_mod(listing), **check_examples(listing)}
    if args.sweep:
        result["exhaustive"] = sweep(listing)
    output = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(output, encoding="utf-8")
    print(output, end="")


if __name__ == "__main__":
    main()
