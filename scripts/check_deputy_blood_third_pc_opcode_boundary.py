"""P0-33 deputy blood-third PC opcode boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/deputy-blood-third-pc-opcode-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["helper"] == "00495AB0"
    assert r["helperBounds"] == ["0x495AB0", "0x495B90"]
    assert r["normalQuarter"]["opcode"] == "C1 F8 02"
    assert r["loveHalf"]["opcode"] == "D1 F8"

    b = d["bloodThird"]
    assert b["divisor"] == 3
    assert b["pcOpcode"] == "open"

    print("PASS: P0-33 preserves /3 as cross-platform-high while PC opcode remains open.")
    print("Helper boundary and /4,/2 PC opcodes are exact.")

if __name__ == "__main__":
    main()
