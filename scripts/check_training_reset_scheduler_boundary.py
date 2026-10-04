"""P0-34 training reset / morale scheduler boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/training-reset-scheduler-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["setSPTrainingStatus"] == ["0x4AD080", "0x4AD160"]
    assert r["setCityTrainingStatus"] == ["0x47B710", "0x47B730"]
    assert r["moraleLocalHandler"] == ["0x59A230", "0x59A4B0"]

    x = d["resolved"]
    assert x["trainingResetBehavior"] is True
    assert x["trainingResetExactCaller"] is False
    assert x["moraleLocalHandlerBoundary"] is True
    assert x["moraleTopSchedulerExactCaller"] is False
    assert x["addressAdjacencyIsNotXrefEvidence"] is True
    assert x["function00599CF0IsTrainingResetCaller"] is False

    print("PASS: historical P0-34 boundary preserved; P0-47 separately recovers S1 reset/field-morale xrefs, stock/full scheduler still open.")

if __name__ == "__main__":
    main()
