"""P0-40 response-fire / double-strike recursion boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/response-fire-recursion-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["responseFireContainingFunction"] == ["0x584D70", "0x584E80"]
    assert r["doubleStrikeContainingFunction"] == ["0x5860A0", "0x587170"]

    x = d["resolved"]
    assert x["responseFireAndDoubleStrikeDifferentFunctions"] is True
    assert x["responseFireExecutorXrefResolved"] is False
    assert x["recursiveChainDepthResolved"] is False

    print("PASS: P0-40 separates response-fire helper from double-strike attack executor.")

if __name__ == "__main__":
    main()
