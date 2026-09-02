# Candidate Submission Template

## Candidate Information
- Full Name: Mustafa Hashmi
- Email: mustafahash153@gmail.com
- LinkedIn or Portfolio:
- Submission Date: September 2, 2026

## Overview

I designed a controlled enterprise onboarding orchestration system that converts an approved HR intake into a validated onboarding case, department-owned tasks, and a personalized first-week plan. AI is used for evidence-backed document extraction, normalization suggestions, classification support, summaries, and communication drafts. Deterministic policy rules and authorized employees retain control over compliance decisions, approvals, and system access.

The implementation deliverable is an importable n8n workflow scaffold. It demonstrates validation, a human-review branch, stable case/task identifiers, policy-based task generation, and a safe deterministic plan without requiring credentials.

## Task 1: AI-Powered Automation Design

### Workflow Logic

1. Receive a signed HRIS/form event and establish an idempotency key.
2. Validate the payload, required fields, enumerations, manager, and start date.
3. Store uploaded documents securely and perform malware scanning/OCR.
4. Use schema-constrained AI extraction with evidence and confidence.
5. Compare extracted values with authoritative HRIS data.
6. Route missing, conflicting, low-confidence, or unsupported cases to HR review.
7. Apply approved policy mappings for equipment, training, and baseline access.
8. Generate idempotent tasks for HR, IT, Security, and the hiring manager.
9. Send controlled access requests through their required approval paths.
10. Generate a first-week plan and stakeholder communication drafts from approved facts.
11. Monitor readiness and milestones from pre-start through Day 90.
12. Complete, retain, anonymize, or delete records according to policy.

The detailed state model, failure handling, security controls, and rollout plan are documented in `starter/design-solution.md`.

### Where AI Is Used

- **Classification:** AI suggests document/access categories for triage, while policy rules choose requirements and approvers.
- **Document processing:** AI extracts supported facts with evidence references and per-field confidence. Invalid or low-confidence output is reviewed.
- **Workflow decision logic:** AI can explain unusual free-text requests, but deterministic thresholds and policies control routing.
- **Automatic drafting:** AI drafts welcome emails, manager briefs, feedback summaries, and first-week plans using approved facts.
- **Recommendations/personalization:** AI selects relevant material only from an allowlisted resource/training catalog; mandatory assignments remain rule-driven.

AI cannot approve employment, decide legal eligibility, infer protected attributes, or directly provision access.

### Prompt Engineering

The versioned prompt specifications in `starter/prompts/prompts.md` include document extraction, normalization, requirements classification, first-week planning, welcome email, manager summary, feedback summarization, and one controlled JSON-repair attempt.

Controls include strict response schemas, nullable unsupported values, enumerations, prompt-injection resistance, minimum-necessary context, evidence/confidence requirements, allowlisted resources, schema validation, human-review fallbacks, and regression evaluation before prompt/model releases.

### Data Flow and Integrations

An HRIS or secure intake form sends a versioned event to an API gateway and n8n. n8n validates and stores a canonical case, invokes secure document/OCR and AI services, queries policy/approval mappings, and calls isolated adapters for ticketing, identity/device management, LMS, calendar, email/chat, and analytics.

Production events use signed webhooks, correlation IDs, scoped OAuth identities, durable queues/outboxes, idempotent upserts, retries, dead-letter handling, and reconciliation jobs. Documents remain in encrypted storage and integrations receive only the data they require.

### Business Impact

- Initiates standard work within minutes instead of relying on email coordination.
- Finds incomplete or conflicting inputs before they create downstream errors.
- Prevents duplicate requests through stable idempotency keys.
- Reduces repetitive HR drafting and status-chasing.
- Gives every owner explicit tasks, dependencies, deadlines, and escalation paths.
- Provides a consistent but role-aware first-week experience.
- Improves auditability without delegating sensitive decisions to AI.

## Task 2: Implementation Demo

### Demo Type

Importable n8n workflow export plus written architecture and prompt specifications.

### Files Included

- `starter/design-solution.md` — architecture, controls, failure handling, rollout, and impact.
- `starter/prompts/prompts.md` — production-minded prompts, output patterns, and evaluation plan.
- `starter/workflows/onboarding-workflow.json` — credential-free n8n workflow scaffold.
- `SUBMISSION_TEMPLATE.md` — completed submission summary.

### Flow of Data

The demo receives a JSON webhook, normalizes the employee record, validates required values, and checks whether HR review is required. Invalid input returns a `202 NEEDS_REVIEW` result without creating provisioning tasks. Valid input is enriched with mock policy mappings; stable tasks and a five-day onboarding plan are created and returned with `201 Created`.

Production-only boundaries—durable storage, OCR/LLM extraction, approvals, ticketing, identity, LMS, calendar, and communication—are explicitly documented and intentionally contain no credentials in the export.

### Pain Points Solved

The demo addresses incomplete intake, inconsistent routing, duplicate task creation, unclear ownership, risky automatic access decisions, and generic onboarding plans. It demonstrates that AI can add value without becoming an unreviewed decision-maker.

## Assumptions

- The HRIS event is emitted only after an authorized HR user approves the hire.
- The HRIS remains authoritative for employment and identity attributes.
- Organization-specific policy tables, catalogs, credentials, and retention periods will be supplied during implementation.
- All requested access requires either a documented baseline policy or system-owner approval.
- The AI provider has an approved enterprise data-processing agreement and suitable privacy configuration.
- Mock data and placeholder adapters are acceptable for the assessment prototype.

## Setup Instructions

1. Install or open n8n.
2. Import `starter/workflows/onboarding-workflow.json`.
3. Open the workflow and select **Test workflow**.
4. Copy the test URL from the **New Hire Webhook** node.
5. Send a `POST` request with `Content-Type: application/json` and this body:

```json
{
  "employeeId": "E-1042",
  "fullName": "Mustafa Hashmi",
  "personalEmail": "mustafahash153@gmail.com",
  "jobTitle": "Data Analyst",
  "department": "Analytics",
  "location": "Islamabad",
  "country": "PK",
  "employmentType": "FULL_TIME",
  "workMode": "HYBRID",
  "startDate": "2026-09-14",
  "managerId": "E-0088",
  "requestedSystems": ["Analytics Read Only"]
}
```

Remove a required field to exercise the human-review route. The workflow is inactive after import and contains no external credentials or live side effects.

## Optional Notes

The prototype uses deterministic plan generation so that it runs without an API key. `starter/prompts/prompts.md` specifies the schema-constrained AI calls that replace or augment the mock boundary in production. This separation keeps the submitted workflow safe to import and straightforward to review.
