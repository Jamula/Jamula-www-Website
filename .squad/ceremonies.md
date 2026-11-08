# Ceremonies

> Team meetings that happen before or after work. Each squad configures their own.

## Design Review

| Field | Value |
|-------|-------|
| **Trigger** | auto |
| **When** | before |
| **Condition** | multi-agent task involving 2+ agents modifying shared systems |
| **Facilitator** | lead |
| **Participants** | all-relevant |
| **Time budget** | focused |
| **Enabled** | ✅ yes |

**Agenda:**
1. Review the task and requirements
2. Agree on interfaces and contracts between components
3. Identify risks and edge cases
4. Assign action items

---

## Retrospective

| Field | Value |
|-------|-------|
| **Trigger** | auto |
| **When** | after |
| **Condition** | build failure, test failure, or reviewer rejection |
| **Facilitator** | lead |
| **Participants** | all-involved |
| **Time budget** | focused |
| **Enabled** | ✅ yes |

**Agenda:**
1. What happened? (facts only)
2. Root cause analysis
3. What should change?
4. Action items for next iteration


---

## Retrospective with Enforcement

| Field | Value |
|-------|-------|
| **Trigger** | auto |
| **When** | weekly |
| **Condition** | No *retrospective* log in .squad/log/ within the last 7 days |
| **Facilitator** | lead |
| **Participants** | all |
| **Time budget** | focused |
| **Enabled** | yes |
| **Enforcement skill** | retro-enforcement |

**Agenda:**
1. What shipped this week? (closed issues, merged PRs)
2. What did not ship? (open issues, blockers)
3. Root cause on any failures
4. Action items -- each MUST become a GitHub Issue labeled retro-action

**Coordinator integration:**
At round start, call Test-RetroOverdue (see skill retro-enforcement). If overdue, run this ceremony before the work queue.

**Why GitHub Issues, not markdown:**
Production data: 0% completion across 6 retros using markdown checklists, 100% after switching to GitHub Issues.

---

## Monthly Side-quest operations review

| Field | Value |
|-------|-------|
| **Trigger** | manual |
| **When** | after |
| **Condition** | Run when the monthly Side-quest operations review is requested. |
| **Facilitator** | Seven |
| **Participants** | Seven, Spock, Data, Uhura |
| **Time budget** | focused |
| **Enabled** | ✅ yes |

**Agenda:**
1. Seven opens the existing monthly business review (MBR), confirms its UTC window and observation time, and checks prior GitHub issue follow-through.
2. Spock presents the available evidence for the metric categories in the [Side-quest operations review runbook](../docs/operations/side-quest-operations-review.md).
3. Data checks source scope, completeness, comparison validity, uncertainty, privacy, access, and retention; missing or unsafe evidence remains unknown.
4. Seven records evidence-backed decisions and routes accepted follow-up through GitHub issues with an owner, acceptance criteria, and linked evidence.
5. Uhura maintains the runbook when an approved process change requires documentation.

The MBR remains the single executive review surface. This ceremony adds no dashboard, telemetry, scheduled automation, or private-data export.
