"""P0-28 hard recruitment gate boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/hard-recruitment-gate-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["function"] == "004AF7D0"
    assert r["functionBounds"] == ["0x4AF7D0", "0x4AFD60"]
    assert r["outResultPointer"] is True
    assert r["handledReturn"] is True
    assert r["successRateCalledOnlyWhenUnhandled"] is True

    x = d["resolved"]
    assert x["hardGateIsShortCircuit"] is True
    assert x["hardGateIsNotProbabilityModifier"] is True
    assert x["threeStateDecisionRequired"] is True
    assert x["internalPriorityResolved"] is False

    assert "hate" in d["confirmedDomains"]
    assert d["runtimeState"]["forbiddenLordField"] == "0x164"

    print("PASS: P0-28 locks hard-gate short-circuit contract and runtime forbidden-service state.")
    print("Internal relationship priority remains open.")

if __name__ == "__main__":
    main()
