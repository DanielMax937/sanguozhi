"""E10 response-fire compatibility-rule checks."""
from dataclasses import dataclass

@dataclass(frozen=True)
class Case:
    defender_crossbow: bool
    has_tech: bool
    arrow_family: bool
    support: bool
    confused: bool
    false_report: bool
    legal_counter: bool
    expected: bool

def can_response_fire(c: Case) -> bool:
    return (
        c.defender_crossbow
        and c.has_tech
        and c.arrow_family
        and not c.support
        and not c.confused
        and not c.false_report
        and c.legal_counter
    )

def main() -> None:
    cases = [
        Case(True, True, True, False, False, False, True, True),
        Case(False, True, True, False, False, False, True, False),
        Case(True, False, True, False, False, False, True, False),
        Case(True, True, False, False, False, False, True, False),
        Case(True, True, True, True, False, False, True, False),
        Case(True, True, True, False, True, False, True, False),
        Case(True, True, True, False, False, True, True, False),
        Case(True, True, True, False, False, False, False, False),
    ]
    for i, c in enumerate(cases):
        actual = can_response_fire(c)
        assert actual == c.expected, (i, actual, c)
    print(f"PASS: {len(cases)} E10 response-fire compatibility predicate cases")
    print("Full 00584DC8 caller, naval profile and PC chaining remain open.")

if __name__ == "__main__":
    main()
