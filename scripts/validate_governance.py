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
        *ROOT.glob(".copilot/*.json"),
        *ROOT.glob(".vscode/*.json"),
    ]
    for path in paths:
        if path.is_file():
            with path.open(encoding="utf-8") as stream:
                json.load(stream)


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


def main() -> None:
    validate_json()
    validate_required_files()
    validate_microsoft_skill_links()
    validate_gitignore()
    validate_deployment_boundary()
    print("Governance validation passed.")


if __name__ == "__main__":
    main()
