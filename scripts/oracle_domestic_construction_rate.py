#!/usr/bin/env python3
"""Execute original non-starred x86 bytes against stable getter/memory stubs.

This is an independent test oracle, not a game emulator or a production kernel.
It does not import production code, use its constants, or evaluate a /9 formula.
The source is an external verified GBK evidence input; no executable is run.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

SOURCE_BLOB = "76b1f9591a9f94830bcf4e5a67764d2911e19fd4"
REGISTERS = ("eax", "ecx", "edx", "ebx", "esp", "ebp", "esi", "edi")
MASK32 = (1 << 32) - 1


def signed(value: int, bits: int = 32) -> int:
    value &= (1 << bits) - 1
    return value - (1 << bits) if value & (1 << (bits - 1)) else value


def load_instructions(path: Path | None) -> dict[int, bytes]:
    if path is None:
        snapshot = Path(__file__).resolve().parents[1] / "docs/sources/domestic-construction-rate-original.txt"
        # Decode/encode without universal-newline normalization: blob identity is
        # checked below before ANY source bytes can enter the interpreter.
        raw = snapshot.read_bytes().decode("utf-8").encode("gbk")
    else:
        raw = path.read_bytes()
    blob = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
    if len(raw) != 5936 or blob != SOURCE_BLOB:
        raise ValueError(f"unexpected source bytes: {len(raw)} bytes, Git blob {blob}")
    instructions = {}
    starred = 0
    for line in raw.decode("gbk").splitlines():
        if line.startswith("*"):
            starred += 1
            continue
        match = re.match(r"^([0-9A-Fa-f]{8}) - ((?:[0-9A-Fa-f]{2} ?)+)\s+-", line)
        if match:
            address, octets = match.groups()
            instructions[int(address, 16)] = bytes.fromhex(octets)
    if starred != 9 or not instructions or min(instructions) != 0x005BB1D0:
        raise ValueError("unexpected original/MOD instruction partition")
    if any(address >= 0x008A0000 for address in instructions):
        raise ValueError("MOD trampoline is not part of the original instruction stream")
    return instructions


class OriginalMachine:
    def __init__(self, instructions: dict[int, bytes], politics: list[int | None], durability: int):
        if len(politics) > 3 or any(p is not None and (type(p) is not int or not 0 <= p <= 255) for p in politics):
            raise ValueError("politics must contain at most three uint8-or-null slots")
        if type(durability) is not int or not 0 <= durability <= 65535:
            raise ValueError("durability must be uint16")
        self.instructions = instructions
        self.r = [0, 0, 0, 0, 0x00100000, 0, 0, 0]
        self.memory: dict[int, int] = {}
        self.people = {}
        self.result = {}
        self.pc = 0x005BB1D0
        self.comparison = 0
        self.getter_calls = 0
        self.facility_calls = 0
        self.facility_reads = 0
        self.write_memory(self.r[4], 0xDEADC0DE, 4)
        self.write_memory(self.r[4] + 4, 0x00200000, 4)
        self.write_memory(self.r[4] + 8, 0x1234, 4)
        for slot in range(3):
            value = politics[slot] if slot < len(politics) else None
            pointer = 0 if value is None else 0x00400000 + slot * 16
            self.write_memory(0x00200000 + slot * 4, pointer, 4)
            if value is not None:
                self.people[pointer] = value
        self.write_memory(0x003000C2, durability, 2)

    def read_memory(self, address, width):
        if address == 0x003000C2:
            self.facility_reads += 1
        return sum(self.memory.get(address + i, 0) << (8 * i) for i in range(width))

    def write_memory(self, address, value, width):
        for i in range(width):
            self.memory[address + i] = (value >> (8 * i)) & 255

    def read(self, operand, width=4):
        kind, location = operand
        return (self.r[location] & ((1 << (width * 8)) - 1)) if kind == "r" else self.read_memory(location, width)

    def write(self, operand, value, width=4):
        kind, location = operand
        mask = (1 << (width * 8)) - 1
        if kind == "r":
            self.r[location] = ((self.r[location] & ~mask) | (value & mask)) & MASK32
        else:
            self.write_memory(location, value, width)

    def modrm(self, data, offset):
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
        return ("r", reg), ("m", address & MASK32), offset

    def run(self):
        for _ in range(256):
            pc = self.pc
            data = self.instructions[pc]
            next_pc = pc + len(data)
            opcode = data[0]
            offset = 1
            width = 4
            if opcode == 0x66:
                opcode, offset, width = data[1], 2, 2
            if 0x50 <= opcode <= 0x57:
                self.r[4] = (self.r[4] - 4) & MASK32
                self.write_memory(self.r[4], self.r[opcode - 0x50], 4)
            elif 0x58 <= opcode <= 0x5F:
                self.r[opcode - 0x58] = self.read_memory(self.r[4], 4)
                self.r[4] += 4
            elif opcode in (0x33, 0x89, 0x8B, 0x85, 0x03, 0x3B, 0x2B):
                reg, rm, offset = self.modrm(data, offset)
                a, b = self.read(reg, width), self.read(rm, width)
                if opcode == 0x33:
                    self.write(reg, a ^ b, width)
                elif opcode == 0x89:
                    self.write(rm, a, width)
                elif opcode == 0x8B:
                    self.write(reg, b, width)
                elif opcode == 0x85:
                    self.comparison = signed(a & b)
                elif opcode == 0x03:
                    self.write(reg, a + b, width)
                elif opcode == 0x2B:
                    self.write(reg, a - b, width)
                else:
                    self.comparison = signed(a) - signed(b)
            elif opcode in (0x74, 0x7D, 0x7C, 0x7E):
                taken = {0x74: self.comparison == 0, 0x7D: self.comparison >= 0,
                         0x7C: self.comparison < 0, 0x7E: self.comparison <= 0}[opcode]
                if taken:
                    next_pc += signed(data[1], 8)
            elif opcode == 0xE8:
                target = next_pc + int.from_bytes(data[1:], "little", signed=True)
                if target == 0x004890A0:
                    self.r[0] = self.people[self.r[1]]
                    self.getter_calls += 1
                elif target == 0x00490B90:
                    if self.read_memory(self.r[4], 4) != 0x1234:
                        raise AssertionError("facility ID stack mismatch")
                    self.r[4] += 4  # the facility getter consumes its stack argument
                    self.r[0] = 0x00300000
                    self.facility_calls += 1
                else:
                    raise ValueError(f"unexpected call target {target:08X}")
            elif opcode == 0x0F:
                reg, rm, offset = self.modrm(data, 2)
                source_width = {0xB6: 1, 0xB7: 2}[data[1]]
                self.write(reg, self.read(rm, source_width))
            elif opcode == 0x47:
                self.r[7] = (self.r[7] + 1) & MASK32
            elif opcode == 0x83:
                reg, rm, offset = self.modrm(data, offset)
                if reg[1] != 7:
                    raise ValueError("unsupported immediate operation")
                self.comparison = signed(self.read(rm)) - signed(data[offset], 8)
            elif 0xB8 <= opcode <= 0xBF:
                self.r[opcode - 0xB8] = int.from_bytes(data[1:], "little")
            elif opcode == 0x99:
                self.r[2] = MASK32 if signed(self.r[0]) < 0 else 0
            elif opcode in (0xD1, 0xC1):
                operation, operand, offset = self.modrm(data, offset)
                shift = 1 if opcode == 0xD1 else data[offset] & 31
                value = self.read(operand)
                if operation[1] == 7:
                    self.write(operand, signed(value) >> shift)
                elif operation[1] == 5:
                    self.write(operand, value >> shift)
                else:
                    raise ValueError("unsupported shift")
            elif opcode == 0xF7:
                operation, operand, offset = self.modrm(data, offset)
                if operation[1] != 5:
                    raise ValueError("only original signed IMUL is allowed")
                product = signed(self.r[0]) * signed(self.read(operand))
                self.r[0], self.r[2] = product & MASK32, (product >> 32) & MASK32
            elif opcode == 0x90:
                pass
            elif opcode == 0xC3:
                if self.read_memory(self.r[4], 4) != 0xDEADC0DE:
                    raise AssertionError("unbalanced original stack")
                self.result.update(rate=signed(self.r[0]), personGetterCalls=self.getter_calls,
                                   facilityGetterCalls=self.facility_calls, facilityReads=self.facility_reads)
                return self.result
            else:
                raise ValueError(f"unsupported opcode {data.hex()} at {pc:08X}")
            if pc == 0x005BB215:
                self.result.update(politicsSum=self.r[5], maxPolitics=self.r[3])
            elif pc == 0x005BB245:
                self.result["halfPoliticsSum"] = signed(self.r[0])
            elif pc == 0x005BB247:
                self.result["politicsRate"] = signed(self.r[3])
            elif pc == 0x005BB250:
                self.result["durabilityQuarter"] = self.r[0]
            elif pc == 0x005BB256:
                self.result["durabilityRemainder"] = signed(self.r[1])
            elif pc == 0x005BB266:
                self.result["durabilityMinimum"] = signed(self.r[1])
            elif pc == 0x005BB26A:
                self.result["selectedBranch"] = "politics" if next_pc == 0x005BB2A3 else "durability-minimum"
            self.pc = next_pc
        raise ValueError("original instruction step bound exceeded")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, help="original GBK; default reconstructs and blob-verifies committed UTF-8 snapshot")
    parser.add_argument("--politics", default="[75,1,0]", help="JSON array, max three uint8 or null slots")
    parser.add_argument("--durability", type=int, default=450)
    parser.add_argument("--sweep-durability", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    instructions = load_instructions(args.source)
    if args.sweep_durability:
        digest = hashlib.sha256()
        branch_counts = {"politics": 0, "durability-minimum": 0}
        for durability in range(65536):
            result = OriginalMachine(instructions, [None, None, None], durability).run()
            digest.update(result["rate"].to_bytes(4, "little"))
            branch_counts[result["selectedBranch"]] += 1
        expected_digest = digest.hexdigest()
        # The production module supplies ACTUAL results only. It never supplies
        # expected values, source constants, interpreter steps or branch rules.
        javascript = """
          import {createHash} from 'node:crypto';
          import {calculateDomesticConstructionRate as calculate} from './packages/engine/src/domestic-construction-rate.ts';
          const hash = createHash('sha256'), bytes = Buffer.alloc(4);
          const branchCounts = {'politics': 0, 'durability-minimum': 0};
          for (let D = 0; D < 65536; D++) {
            const actual = calculate({profile:'domestic-construction-rate-stable-v1',politics:[null,null,null],facilityDurability:D});
            if (!actual.supported) throw new Error('Rejected uint16 durability ' + D);
            bytes.writeUInt32LE(actual.rate); hash.update(bytes);
            branchCounts[actual.selectedBranch]++;
          }
          process.stdout.write(JSON.stringify({digest:hash.digest('hex'),branchCounts}));
        """
        completed = subprocess.run(
            ["node", "--max-old-space-size=512", "--max-semi-space-size=16", "--input-type=module", "-e", javascript],
            cwd=Path(__file__).resolve().parents[1], check=True, capture_output=True, text=True)
        actual = json.loads(completed.stdout)
        if actual != {"digest": expected_digest, "branchCounts": branch_counts}:
            raise AssertionError(f"production differs from byte interpreter: {actual!r}")
        result = {"sourceGitBlob": SOURCE_BLOB, "sourceInstructionCount": len(instructions),
                  "durabilityCases": 65536, "zeroPoliticsRateU32LESha256": expected_digest,
                  "branchCounts": branch_counts, "productionDigestAndBranchesMatch": True,
                  "starredModExecuted": False}
    else:
        result = OriginalMachine(instructions, json.loads(args.politics), args.durability).run()
    text = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(text, encoding="utf-8")
    print(text, end="")


if __name__ == "__main__":
    main()
