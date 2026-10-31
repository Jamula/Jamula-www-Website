from __future__ import annotations

import hashlib
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
    if "COPILOT_ASSIGN_TOKEN ||" in triage:
        fail("Copilot assignment must fail closed instead of falling back to GITHUB_TOKEN")
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
    if "@bradygaster/squad-cli@1.1.0" not in mcp or "@insider" in mcp:
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


def validate_deployment_boundary() -> None:
    build = (ROOT / ".github/workflows/azure-static-web-apps.yml").read_text(encoding="utf-8")
    preview = (ROOT / ".github/workflows/azure-static-web-apps-preview.yml").read_text(
        encoding="utf-8"
    )
    jobs = dict(
        re.findall(
            r"^  ([a-z][a-z0-9-]*):\n(.*?)(?=^  [a-z][a-z0-9-]*:\n|\Z)",
            build.split("jobs:\n", 1)[1],
            flags=re.MULTILINE | re.DOTALL,
        )
    )
    for name in ("prepare", "build"):
        if name not in jobs or "secrets." in jobs[name] or "environment:" in jobs[name]:
            fail(f"The PR {name} job must not access a deployment secret or environment")
    for name in ("deploy", "deploy-com"):
        job = jobs.get(name, "")
        if "github.event_name == 'push'" not in job or "environment: swa-deployment" not in job:
            fail(f"{name} must require a production push and the main-only environment")
    if "workflow_run:" not in preview or "\n  pull_request:" in preview:
        fail("Preview deployment must run as a trusted workflow_run")
    if "environment: swa-deployment" not in preview or "ref: ${{ github.workflow_sha }}" not in preview:
        fail("Preview deployment must use main-only secrets and trusted deployment tools")
    if "npm ci" in preview or "npm install" in preview:
        fail("The trusted preview workflow must never execute PR dependency scripts")
    if "AZURE_STATIC_WEB_APPS_API_TOKEN_SWA_JAMULA_" in build + preview:
        fail("Deployment workflows must not fall back to old repository-level token names")
    if "SWA_NET_DEPLOYMENT_TOKEN" not in build + preview or "SWA_COM_DEPLOYMENT_TOKEN" not in build:
        fail("Deployment workflows must use the environment-scoped token names")


def validate_casting_transaction() -> None:
    casting = ROOT / ".squad/casting"
    manifest = json.loads((casting / "registry-history.commit.json").read_text(encoding="utf-8"))
    for name in ("registry", "history"):
        content = (casting / f"{name}.json").read_bytes()
        if hashlib.sha256(content).hexdigest() != manifest[f"{name}_sha256"]:
            fail(f"Casting {name} bytes do not match the managed transaction manifest")
        document = json.loads(content)
        if document.get("transaction_id") != manifest["transaction_id"]:
            fail(f"Casting {name} does not belong to the current transaction")
        revision_field = "revision" if name == "registry" else "registry_revision"
        if document.get(revision_field) != manifest["registry_revision"]:
            fail(f"Casting {name} has a mismatched transaction revision")
    attributes = subprocess.run(
        [
            "git", "check-attr", "text", "--",
            ".squad/casting/registry.json",
            ".squad/casting/history.json",
            ".squad/casting/registry-history.commit.json",
        ],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    ).stdout.splitlines()
    if len(attributes) != 3 or any(not line.endswith(": text: unset") for line in attributes):
        fail("Managed casting JSON must disable Git newline conversion to preserve its hashes")


def main() -> None:
    validate_json()
    validate_roster()
    validate_routing()
    validate_required_files()
    validate_microsoft_skill_links()
    validate_no_machine_paths()
    validate_workflow_policy()
    validate_gitignore()
    validate_deployment_boundary()
    validate_casting_transaction()
    print("Governance validation passed.")


if __name__ == "__main__":
    main()
