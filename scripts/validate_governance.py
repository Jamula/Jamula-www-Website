from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def fail(message: str) -> None:
    raise SystemExit(message)


def validate_json() -> None:
    paths = [
        *ROOT.glob(".squad/**/*.json"),
        *ROOT.glob(".copilot/*.json"),
        *ROOT.glob(".vscode/*.json"),
    ]
    for path in paths:
        if path.is_file():
            with path.open(encoding="utf-8") as stream:
                json.load(stream)


def validate_roster() -> None:
    team_path = ROOT / ".squad" / "team.md"
    team = team_path.read_text(encoding="utf-8")
    required = [
        "## Members",
        "Jean-Luc Picard",
        "Jadzia Dax",
        "Nyota Uhura",
        "Geordi La Forge",
        "Seven of Nine",
        "Miles O'Brien",
        "Sarek",
        "Scribe",
        "Ralph",
        "Rai",
        "Fact Checker",
    ]
    missing = [value for value in required if value not in team]
    if missing:
        fail(f"Roster is missing: {', '.join(missing)}")

    charter_paths = re.findall(r"`(\.squad/agents/[^`]+/charter\.md)`", team)
    missing_charters = [path for path in charter_paths if not (ROOT / path).is_file()]
    if missing_charters:
        fail(f"Missing charter files: {', '.join(missing_charters)}")

    policy_names = {
        "copilot-good-fit",
        "copilot-needs-review",
        "copilot-not-suitable",
    }
    found_policies = set(
        re.findall(
            r"<!--\s*(copilot-(?:good-fit|needs-review|not-suitable)):\s*[^>]+-->",
            team,
        )
    )
    if found_policies != policy_names:
        fail("Copilot capability policy comments are missing or malformed")


def validate_routing() -> None:
    routing = (ROOT / ".squad" / "routing.md").read_text(encoding="utf-8")
    expected = {
        "jean-luc-picard",
        "jadzia-dax",
        "nyota-uhura",
        "geordi-la-forge",
        "seven-of-nine",
        "miles-obrien",
        "sarek",
    }
    routes = {
        name: [keyword.strip().lower() for keyword in keywords.split(",")]
        for name, keywords in re.findall(
            r"<!--\s*route:([a-z0-9-]+)=([^>]+)-->",
            routing,
            flags=re.IGNORECASE,
        )
    }
    if set(routes) != expected:
        fail(f"Routing policy mismatch: expected {sorted(expected)}, found {sorted(routes)}")

    def route(text: str) -> str | None:
        best: tuple[int, str] | None = None
        for name, keywords in routes.items():
            score = sum(
                len(keyword)
                for keyword in keywords
                if re.search(
                    rf"(^|[^a-z0-9]){re.escape(keyword)}([^a-z0-9]|$)",
                    text,
                    flags=re.IGNORECASE,
                )
            )
            if score and (best is None or score > best[0]):
                best = (score, name)
        return best[1] if best else None

    routing_examples = {
        "Build authentication backend": "seven-of-nine",
        "Create a LinkedIn video case study": "nyota-uhura",
        "Evaluate Wix hosting and DNS": "geordi-la-forge",
        "Review trademark and license terms": "sarek",
        "Define accessibility and responsive design": "jadzia-dax",
        "Create backup reliability tests": "miles-obrien",
        "Set roadmap priorities and ADR scope": "jean-luc-picard",
    }
    for text, expected_owner in routing_examples.items():
        actual_owner = route(text)
        if actual_owner != expected_owner:
            fail(f'Routing example "{text}" resolved to {actual_owner}, expected {expected_owner}')


def validate_required_files() -> None:
    required = [
        "LICENSE",
        "LICENSE_SCOPE.md",
        "TRADEMARKS.md",
        "CONTRIBUTING.md",
        "THIRD_PARTY_NOTICES.md",
        "docs/README.md",
        "docs/planning/evaluation-plan.md",
        "docs/legal/license-inventory.md",
        ".github/skills/cloud-solution-architect/SKILL.md",
        ".mcp.json",
    ]
    missing = [path for path in required if not (ROOT / path).is_file()]
    if missing:
        fail(f"Required governance files are missing: {', '.join(missing)}")


def validate_microsoft_skill_links() -> None:
    skill = ROOT / ".github" / "skills" / "cloud-solution-architect" / "SKILL.md"
    text = skill.read_text(encoding="utf-8")
    references = re.findall(r"\]\(\./(references/[^)]+)\)", text)
    missing = [reference for reference in references if not (skill.parent / reference).is_file()]
    if missing:
        fail(f"Microsoft skill references are missing: {', '.join(missing)}")


def validate_no_machine_paths() -> None:
    candidates = [
        ROOT / ".squad" / "team.md",
        ROOT / ".squad" / "routing.md",
        ROOT / ".github" / "copilot-instructions.md",
        ROOT / "docs" / "README.md",
    ]
    pattern = re.compile(r"[A-Za-z]:\\Users\\", re.IGNORECASE)
    if not pattern.search(r"C:\Users\example\repo"):
        fail("Machine-path validation regex is not matching standard Windows paths")
    offenders = [str(path.relative_to(ROOT)) for path in candidates if pattern.search(path.read_text(encoding="utf-8"))]
    if offenders:
        fail(f"Machine-local paths found in: {', '.join(offenders)}")


def validate_workflow_policy() -> None:
    heartbeat = (ROOT / ".github/workflows/squad-heartbeat.yml").read_text(encoding="utf-8")
    triage = (ROOT / ".github/workflows/squad-triage.yml").read_text(encoding="utf-8")
    assignment = (ROOT / ".github/workflows/squad-issue-assign.yml").read_text(encoding="utf-8")
    label_sync = (ROOT / ".github/workflows/sync-squad-labels.yml").read_text(encoding="utf-8")
    issue_form = (ROOT / ".github/ISSUE_TEMPLATE/squad-work.yml").read_text(encoding="utf-8")
    mcp = (ROOT / ".mcp.json").read_text(encoding="utf-8")

    if "types: [closed, labeled]" in heartbeat or "issues: write" in heartbeat:
        fail("Heartbeat must remain a read-only monitor; Squad Triage owns assignment")
    if "hasCopilot && copilotAutoAssign" not in triage:
        fail("Squad Triage must honor the Copilot auto-assignment policy")
    if "routingContent.matchAll" not in triage or "copilot-good-fit" not in triage:
        fail("Squad Triage must parse routing and capability policy from authoritative files")
    if "keywordMatches" not in triage or "bestRoute" not in triage:
        fail("Squad Triage must use boundary-aware scored routing")
    if "copilot-swe-agent[bot]" not in triage or "COPILOT_ASSIGN_TOKEN" not in triage:
        fail("Squad Triage must perform approved Copilot assignment directly")
    if "slugify(cells[0]) === memberName" not in assignment:
        fail("Squad Issue Assign must compare slugged roster names")
    if "steps.copilot_policy.outputs.enabled == 'true'" not in assignment:
        fail("Squad Issue Assign must gate Copilot assignment on explicit policy")
    if "branches: [main]" not in label_sync:
        fail("Squad label synchronization must run automatically only from main")
    if "github.event.repository.default_branch" not in label_sync:
        fail("Manual label synchronization must check out the default branch")
    if "labels:\n  - squad" not in issue_form:
        fail("Squad issue form must apply the authoritative triage label")
    if "@bradygaster/squad-cli@0.12.0" not in mcp or "@insider" in mcp:
        fail("Squad state MCP must use the reviewed pinned package version")


def validate_gitignore() -> None:
    ignored = subprocess.run(
        ["git", "check-ignore", "--no-index", "--quiet", ".env.local"],
        cwd=ROOT,
        check=False,
    )
    if ignored.returncode != 0:
        fail(".env.local and other environment variants must be ignored")

    allowed = subprocess.run(
        ["git", "check-ignore", "--no-index", "--quiet", ".env.example"],
        cwd=ROOT,
        check=False,
    )
    if allowed.returncode == 0:
        fail("Safe .env.example templates must remain trackable")


def main() -> None:
    validate_json()
    validate_roster()
    validate_routing()
    validate_required_files()
    validate_microsoft_skill_links()
    validate_no_machine_paths()
    validate_workflow_policy()
    validate_gitignore()
    print("Governance validation passed.")


if __name__ == "__main__":
    main()
