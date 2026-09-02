# Enterprise AI Onboarding Automation — Solution Design

## 1. Executive summary

This solution turns a new-hire submission into a controlled, auditable onboarding case. A workflow orchestrator validates the intake, extracts facts from documents, applies deterministic policy rules, creates work for HR, IT, Security, and the hiring manager, and drafts a personalized onboarding plan. AI assists with unstructured information and communication; it does not approve employment, grant access, or make compliance decisions.

The prototype uses n8n as the orchestration layer and mock adapters for systems that would normally be supplied by an HRIS, identity platform, ticketing system, learning platform, email, and calendar. This keeps the demo importable while making the production boundaries explicit.

## 2. Goals and success measures

### Goals

- Create one reliable onboarding case from every valid HR submission.
- Detect missing or conflicting information before downstream provisioning begins.
- Generate consistent, role-aware tasks and communications.
- Keep humans responsible for sensitive or ambiguous decisions.
- Provide an audit trail from intake through completion.

### Suggested operational measures

| Measure | Target |
|---|---:|
| Valid cases acknowledged | Within 5 minutes |
| Standard onboarding task creation | Within 15 minutes |
| Cases requiring manual data correction | Under 10% after rollout |
| Duplicate provisioning requests | Zero |
| Onboarding tasks completed before start date | At least 95% |
| New-hire onboarding satisfaction | At least 4/5 |

## 3. Actors and system boundaries

| Actor/system | Responsibility |
|---|---|
| HR/HRIS | Source of truth for identity, employment status, start date, manager, and approved role |
| New hire | Supplies requested information and documents; receives the onboarding plan |
| Workflow orchestrator | Validation, routing, retries, state management, and audit events |
| AI service | Document extraction, normalization suggestions, summaries, and draft generation |
| HR operations | Reviews missing, conflicting, or low-confidence information |
| IT/Identity | Provisions approved devices, accounts, groups, and application access |
| Security/Compliance | Owns policy decisions and exceptions |
| Hiring manager | Confirms role-specific access, schedule, buddy, and first-week priorities |
| Ticketing/LMS/Calendar/Email | Executes tasks and communications after approval |

## 4. Canonical onboarding case

Every system exchange is mapped to a versioned canonical record. Sensitive document contents remain in encrypted document storage; the workflow stores only references and required extracted facts.

```json
{
  "schemaVersion": "1.0",
  "caseId": "ONB-2026-000123",
  "idempotencyKey": "hris-employee-id:start-date",
  "status": "NEEDS_REVIEW",
  "employee": {
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
    "managerId": "E-0088"
  },
  "documents": [
    {
      "documentId": "doc_123",
      "type": "NATIONAL_ID",
      "storageUri": "vault://onboarding/doc_123",
      "malwareScan": "CLEAN",
      "extractionConfidence": 0.96
    }
  ],
  "requirements": {
    "equipmentProfile": "STANDARD_LAPTOP",
    "trainingCodes": ["SECURITY_101", "PRIVACY_101"],
    "requestedSystems": ["EMAIL", "SLACK", "ANALYTICS_READONLY"]
  },
  "validation": {
    "missingFields": [],
    "conflicts": [],
    "requiresHumanReview": false
  },
  "timestamps": {
    "receivedAt": "2026-09-02T10:00:00Z",
    "updatedAt": "2026-09-02T10:01:00Z"
  }
}
```

### Case states

```text
RECEIVED → VALIDATING → NEEDS_REVIEW ─┐
                    └→ APPROVED       │
APPROVED → TASKS_CREATED → IN_PROGRESS → READY_FOR_DAY_ONE
READY_FOR_DAY_ONE → ACTIVE → COMPLETED
Any active state → BLOCKED or CANCELLED
```

Only authorized HR events may move a case from `NEEDS_REVIEW` to `APPROVED` or to `CANCELLED`. A rehire or changed start date creates a controlled revision rather than silently overwriting the original case.

## 5. End-to-end workflow

### Step 1 — Receive and authenticate intake

The HRIS sends a signed webhook after HR marks a hire as approved. The gateway verifies the signature, timestamp, source allowlist, and payload size. The workflow rejects replayed requests and derives an idempotency key from the HRIS employee ID and effective start date.

Expected outcome: one `RECEIVED` case and one audit event, even when the HRIS retries the same webhook.

### Step 2 — Validate deterministic fields

JSON Schema validation checks required types and formats. Business rules verify that the start date is plausible, the manager exists, enumerations are recognized, and the location/department maps to supported policies. Invalid records are quarantined without calling AI or downstream systems.

Required fields include employee ID, legal/preferred name as permitted, job title, department, location, employment type, start date, manager, and contact route.

### Step 3 — Secure document ingestion

Uploads use short-lived signed URLs. Files are restricted by type and size, malware-scanned, encrypted, and placed in a restricted store. The workflow records document IDs and checksums instead of copying raw documents between nodes. Logs redact document text and personal identifiers.

### Step 4 — Extract and normalize unstructured information

For supported documents, OCR and the extraction prompt return schema-constrained JSON. Each extracted claim contains a source reference, confidence, and evidence location. The service treats document contents as untrusted data and ignores instructions embedded inside them.

AI output is never accepted as authoritative by itself. It is compared with HRIS values and deterministic formatting rules. The original value is preserved beside every suggested normalization.

### Step 5 — Decide whether human review is required

The rules engine routes a case to HR review when any of these conditions is true:

- A required field or document is missing.
- Identity or start-date values conflict across authoritative sources.
- Extraction confidence for a required field is below 0.85.
- The role, country, employment type, or access request has no policy mapping.
- A document failed malware, authenticity, or expiry checks.
- The AI output is invalid, incomplete, or cannot be parsed after one repair attempt.

The reviewer sees the source values, AI suggestion, reason codes, and evidence—not only a generated summary. Approval and correction are logged with reviewer identity and timestamp.

### Step 6 — Enrich with approved policy data

After validation, deterministic tables map the approved role, department, location, and employment type to equipment, baseline groups, required training, compliance steps, and service-level deadlines. Manager-requested access is added as `PENDING_APPROVAL`; AI may explain or classify a request but cannot approve it.

### Step 7 — Generate an execution plan

The workflow constructs tasks from templates:

| Owner | Example tasks |
|---|---|
| HR | Verify documents, payroll enrollment, policy acknowledgement |
| IT | Laptop preparation, email/account creation, approved application access |
| Security | MFA enrollment, security training, exceptional access review |
| Manager | Buddy assignment, first-week schedule, role objectives, access confirmation |
| New hire | Profile completion, mandatory training, policy acknowledgement |

Each task has a stable external key (`caseId:taskCode`), owner group, due date relative to the start date, dependencies, approval state, and escalation policy. Upsert semantics prevent duplicates during retries.

### Step 8 — Create downstream records

The orchestrator writes the canonical case, then creates or updates tickets, LMS assignments, and calendar holds through adapter sub-workflows. A partial failure does not restart successful actions. Each adapter stores the external record ID and supports safe retry with exponential backoff and jitter.

High-risk access follows the organization's approval workflow. The prototype emits a mock request only; production credentials must be least-privileged service identities stored in a secrets manager.

### Step 9 — Generate personalized drafts

The planning prompt receives only approved, minimum-necessary attributes and an allowlisted resource catalog. It returns a structured first-week plan and communication drafts. Generated URLs are prohibited; resource links must reference catalog IDs supplied by the organization.

HR or the manager approves external-facing drafts during the pilot. After quality metrics are established, low-risk template-based messages may be auto-sent while exceptions remain reviewed.

### Step 10 — Notify stakeholders

Notifications contain a case link and minimal context, never identity documents or unnecessary personal data. The new hire receives a welcome message only after HR approval and according to the preferred communication channel. Delivery failures become retryable tasks rather than silent errors.

### Step 11 — Monitor readiness and milestones

Scheduled checks run at configurable offsets such as T-7, T-3, T-1, Day 1, Day 7, Day 30, and Day 90. They reconcile downstream task status, remind owners, escalate overdue blockers, gather new-hire feedback, and update the readiness state. A cancellation event stops pending messages and triggers deprovisioning/cancellation tasks.

### Step 12 — Complete and retain

Completion requires all mandatory tasks or documented exceptions. Operational events and approvals are retained according to policy. Raw documents and generated drafts use separate retention schedules. At expiry, records are deleted or anonymized with a verifiable audit event.

## 6. Where AI is and is not used

| Capability | AI responsibility | Deterministic/human control |
|---|---|---|
| Document extraction | Return candidate fields with evidence and confidence | Schema validation and HR confirmation |
| Classification | Suggest document type or access category | Policy engine selects requirements and approvers |
| Normalization | Suggest canonical department/title wording | Original value retained; HRIS remains authoritative |
| Summarization | Produce concise stakeholder summaries | Source record is always accessible |
| Drafting | Welcome email, manager brief, first-week plan | Allowlisted facts/resources; review for exceptions |
| Recommendations | Suggest training from approved catalog | Rules enforce mandatory courses and approvals |

AI is explicitly excluded from hiring decisions, background-check conclusions, compensation decisions, legal eligibility decisions, medical/disability inference, protected-attribute inference, and direct access provisioning.

## 7. Prompt engineering approach

Prompts are stored and versioned separately from workflow code. Every call includes a task-specific system instruction, a JSON schema, the minimum required context, and a correlation ID. The complete prototype prompts are in `starter/prompts/prompts.md`.

Key controls:

- Treat uploaded content as data, never instructions.
- Require strict JSON without prose for machine-consumed responses.
- Use enums and nullable fields instead of invented values.
- Require evidence and per-field confidence for extraction.
- Provide an allowlisted policy/resource catalog for recommendations.
- Reject unsupported claims and record warnings.
- Validate responses; retry once with a repair prompt, then route to review.
- Pin the model and prompt version and evaluate changes before release.

## 8. Integration and data flow

```text
HRIS / secure form
        │ signed event + document references
        ▼
API gateway → n8n orchestration → case database / audit log
                    │
                    ├→ malware/OCR/document service → LLM extraction
                    ├→ policy and approval service
                    ├→ ticketing / identity / device management
                    ├→ LMS / calendar / email / chat
                    └→ analytics (pseudonymized operational events)
```

### Production integration principles

- REST/webhook contracts are versioned and validated at boundaries.
- OAuth/service credentials are scoped per adapter and rotated.
- Events include correlation IDs; logs exclude raw PII and prompts containing PII.
- A transactional outbox or durable queue prevents lost downstream actions.
- Dead-letter queues hold exhausted failures for operator replay.
- Webhooks are signed and protected against replay.
- Reconciliation jobs compare workflow state with downstream systems.

## 9. Reliability and exception handling

| Failure | Handling |
|---|---|
| Duplicate intake | Return existing case using idempotency key |
| Invalid input | Quarantine and notify HR with field-level errors |
| AI timeout/rate limit | Exponential retry; then deterministic fallback/manual review |
| Invalid AI JSON | Schema repair once; then review queue |
| Downstream 429/5xx | Adapter retry with jitter and circuit breaker |
| Permanent downstream 4xx | Mark task blocked and notify system owner |
| Partial execution | Resume incomplete tasks using stored external IDs |
| Start-date/manager change | Recalculate impacted tasks and preserve revision history |
| Hire cancellation | Stop communications and initiate cancellation/deprovisioning plan |

## 10. Security, privacy, and governance

- Data minimization: send only task-relevant fields to each integration and the AI provider.
- Encryption: TLS in transit and managed encryption keys at rest.
- Access control: role-based access with stronger restrictions on identity documents.
- Secrets: managed secret store; no API keys in workflow exports or source control.
- Vendor controls: enterprise AI configuration with no training on submitted data where contractually supported.
- Auditability: immutable events for input versions, prompt/model versions, approvals, task creation, and outbound messages.
- Retention: category-specific retention and deletion with legal-policy ownership.
- Fairness: no inference or use of protected characteristics; periodic review of recommendations and escalation rates.
- Human accountability: named owner and appeal/correction path for every exception.

## 11. Observability and operations

Dashboards should track intake volume, time in each state, extraction confidence, manual-review rate, AI parse failures, task SLA breaches, integration errors, message delivery, and readiness by start date. Alerts should focus on business impact—for example, a start within 24 hours with blocked mandatory tasks—rather than every transient retry.

Every execution carries `caseId`, `correlationId`, `workflowVersion`, `promptVersion`, and external record IDs. Operational logs use tokenized employee identifiers.

## 12. Prototype implementation

The included n8n workflow demonstrates:

1. Webhook intake.
2. Input normalization and deterministic validation.
3. A human-review branch for missing fields.
4. Generation of stable case/task records.
5. A mock personalized first-week plan.
6. A response containing state, tasks, and next actions.

The workflow intentionally uses mock policy data and no credentials, allowing a reviewer to import and execute it safely. Production adapters and the AI call are documented boundaries rather than embedded secrets.

## 13. Rollout plan

1. **Shadow mode:** process copied HRIS events without creating downstream records; compare extraction with HR decisions.
2. **HR pilot:** one department/location, mandatory review of AI outputs, measure exception causes.
3. **Controlled automation:** auto-create low-risk standard tasks; retain approval for access and external communication.
4. **Scale:** add locations and systems only after policy mappings, security review, load tests, and recovery exercises.

Rollback is implemented with workflow version pinning and feature flags per adapter. Existing cases finish on their recorded workflow version unless explicitly migrated.

## 14. Expected business impact

- Faster initiation through event-driven task creation.
- Fewer incomplete cases through early validation and evidence-backed review.
- Lower HR coordination effort through standardized routing and reminders.
- More consistent employee experience through approved role-specific plans.
- Better management visibility through explicit states, owners, deadlines, and blockers.
- Reduced operational risk through idempotency, approvals, least privilege, and audit history.

The design deliberately favors reliable orchestration and accountable decisions over unconstrained AI autonomy. That makes the solution suitable for gradual adoption in an enterprise environment.
