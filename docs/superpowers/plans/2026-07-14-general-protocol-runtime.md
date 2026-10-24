# HelpMeDecide General Protocol Runtime Plan

Date: 2026-07-14

Status: Approved design handoff

> **Superseded as the active release gate:** [HelpMeDecide Purchase Alpha](../../PRODUCT_ALPHA.md), dated 2026-10-23, now governs implementation and release. The generalized runtime and third-party-authoring proof remain possible later work; they are not prerequisites for the private purchase alpha.

Related documents:

- [Product Design](../specs/2026-07-03-helpmedecide-product-design.md)
- [Implementation Roadmap](../../ROADMAP.md)

## Summary

Build HelpMeDecide as an Adaptive Decision Studio for accountable team decision owners. Its differentiator is not another poll, template library, or decision log. It executes a defensible, versioned decision protocol and produces an auditable Decision Dossier.

The first proof succeeds when a Decision RFC and one independently authored, materially different protocol run through the same generic system without protocol-specific application code. The owner remains the final decision-maker; collaborators provide evidence, objections, advice, or process approval according to assigned roles.

This document defines the product and architecture handoff. The implementation roadmap continues to own release sequencing. Before implementation begins, this work must be reconciled with the roadmap's current release boundaries and repository baseline.

## Product Thesis

HelpMeDecide should help an owner answer four questions:

1. What decision are we actually making?
2. What process is appropriate for making it?
3. What evidence, input, dissent, and approval does that process require?
4. Can the owner later explain why the decision was reasonable?

The core primitive is an executable protocol rather than a static template. A protocol is typed, versioned, attributable to an author, validated before publication, and interpreted by a generic runtime. It defines roles, required inputs, calculations, branches, completion rules, outputs, and the provenance that must appear in the final dossier.

### Target user

The first user is an accountable decision owner in a small team, such as a founder, product lead, or operator. They need to make a consequential decision and later explain the method, evidence, input, dissent, and rationale behind it.

### Product proof

The initial release must prove:

- Decision RFC runs end-to-end as the reference protocol.
- An outside practitioner authors or adapts a materially different protocol using only the documented contract and action registry.
- Both protocols publish through the same validator and execute through the same reducer and generic workspace.
- Neither protocol requires protocol-specific application branches.
- Each completed run produces an inspectable dossier.

Third-party authorability is required in the first proof. Public marketplace discovery, ranking, reviews, payments, moderation, and submission mechanics are not.

## First Runtime Release

### Included

- A shared protocol contract package with TypeScript types and JSON Schema.
- Immutable protocol versions and a schema-aware import, validation, and preview path for trusted authors.
- Safe declarative expressions, typed action and field registries, validation, a reducer, and a dry-run harness.
- Event-backed protocol runs with atomic command application, role enforcement, idempotency, and materialized projections.
- A generic decision-owner workspace showing the next required action, protocol timeline, strongest objection, missing evidence, and pending roles.
- Decision RFC and one outside-authored protocol.
- Existing pure framework calculations required by those protocols.
- One AI synthesis action whose inputs and outputs are persisted.
- Decision Dossier generation.

### Deferred

- Adaptive AI protocol selection.
- Scheduled reminders.
- External research connectors.
- Outcome calibration and cross-run protocol analytics.
- A production visual protocol builder.
- Public protocol discovery, ratings, payments, moderation, and certification.

The existing deterministic recommender may suggest the two available protocols using declared applicability rules. An owner may override the recommendation by recording a reason.

## Protocol Contract

The canonical contract lives in the backend repository under `packages/protocol-contract` and is published privately as `@helpmedecide/protocol-contract`. It contains TypeScript types, JSON Schema, the safe-expression grammar, command and event schemas, action definitions, and shared fixtures.

The frontend pins the published package version and must not maintain handwritten copies. YAML authoring input is converted to canonical validated JSON before checksumming and publication.

### Definition model

```ts
type ProtocolDefinition = {
  protocolId: string;
  version: string;
  schemaVersion: number;
  title: string;
  author: ProtocolAuthor;
  applicability: ApplicabilityRule[];
  roles: RoleDefinition[];
  steps: StepDefinition[];
  outputs: OutputDefinition[];
};

type StepDefinition = {
  key: string;
  kind: "collect" | "review" | "calculate" | "decide" | "approve" | "generate";
  assigneeRole: string;
  fields?: FieldDefinition[];
  actionKey?: string;
  visibleWhen?: SafeExpression;
  completeWhen: SafeExpression;
  transitions: TransitionRule[];
  joinPolicy?: JoinPolicy;
  loopPolicy?: LoopPolicy;
  actionPolicy?: ActionPolicy;
  transitionPolicy?: TransitionPolicy;
};

type JoinPolicy = {
  mode: "all" | "any" | "threshold";
  dependencyKeys: string[];
  threshold?: number;
  allowSkipped: boolean;
};

type LoopPolicy = {
  maxIterations: number;
};

type ActionPolicy = {
  kind: "pure" | "effectful";
  timeoutMs?: number;
  maxAttempts?: number;
  backoffMs?: number[];
};

type TransitionPolicy = {
  mixedMatch: "exclusive_wins" | "fork_wins" | "error";
  equalPriority: "declaration_order" | "error";
};

type TransitionRule = {
  to: string;
  when: SafeExpression;
  priority: number;
  mode?: "exclusive" | "fork";
};
```

`ProtocolAuthor`, `ApplicabilityRule`, `RoleDefinition`, `OutputDefinition`, `FieldDefinition`, and every other referenced public type must have an explicit JSON-serializable schema. Unknown fields, field types, action keys, or renderer keys fail publication.

Published definitions are immutable, checksummed, and attributable. Schema migrations are explicit and versioned; a published definition is never silently rewritten.

### Safe expressions

```ts
type SafeExpression =
  | { op: "value"; path: string }
  | { op: "literal"; value: string | number | boolean | null }
  | { op: "and" | "or"; args: SafeExpression[] }
  | { op: "not"; arg: SafeExpression }
  | {
      op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains";
      left: SafeExpression;
      right: SafeExpression;
    }
  | { op: "present"; arg: SafeExpression }
  | { op: "count"; arg: SafeExpression };
```

Expressions may read only whitelisted projection paths. A missing path resolves to `null`; comparisons with `null` are false except for `eq`, `neq`, and `present`. Expressions cannot execute functions, mutate state, read the clock, access the network, or evaluate dynamic code.

### Runs and projections

```ts
type ProtocolRun = {
  runId: string;
  decisionId: string;
  protocolVersionId: string;
  status: "draft" | "active" | "blocked" | "complete" | "cancelled";
  revision: number;
  projection: ProtocolRunProjection;
};

type ProtocolRunProjection = {
  activeStepKeys: string[];
  stepStates: Record<
    string,
    "locked" | "ready" | "active" | "blocked" | "complete" | "skipped" | "failed"
  >;
  fieldValues: Record<string, unknown>;
  roleAssignments: Record<string, string[]>;
  actionStates: Record<string, ActionLifecycle>;
  loopIterations: Record<string, number>;
};

type ActionLifecycle = {
  logicalActionId: string;
  status: "queued" | "running" | "succeeded" | "failed" | "timed_out" | "cancelled";
  attempt: number;
  inputChecksum: string;
  resultEventId?: string;
  errorCode?: string;
};
```

### Commands and events

`ProtocolCommand` is a discriminated union rather than an open string and unknown payload. It covers:

- `run.start`
- `field.submit`
- `role.assign`
- `step.skip`
- `action.retry`
- `run.cancel`
- `decision.record`
- `process.approve`

Every command includes an idempotency key, expected revision, actor context, and a type-specific validated payload.

```ts
type ProtocolEvent<TType extends string, TPayload> = {
  schemaVersion: number;
  eventId: string;
  runId: string;
  sequence: number;
  commandId: string;
  actorId: string;
  type: TType;
  payload: TPayload;
  occurredAt: string;
};
```

Each event type has a corresponding payload schema. Clients submit commands, never precomputed events or projections.

## Deterministic Runtime

1. The prompt parser creates or updates the canonical Decision Map.
2. Applicability rules rank protocols and explain recommendations, exclusions, and missing prerequisites.
3. Starting a run pins the immutable decision and protocol versions, assigns roles, and emits `run.started`.
4. The backend validates identity, role, revision, schema, and transition eligibility for every command.
5. Accepted commands append immutable events and update the materialized projection atomically.
6. The reducer evaluates step completion and eligible transitions after applying the accepted events.
7. Exclusive transitions sort by descending priority and then declaration order only when that tie policy is explicitly enabled.
8. A mixed match between fork and exclusive transitions is a publication error unless an explicit `mixedMatch` policy determines the result.
9. Overlapping equal-priority exclusive transitions are a publication error unless declaration-order arbitration is explicitly enabled.
10. Fork transitions activate every eligible target. Joins apply their declared dependency, threshold, and skipped-step rules.
11. Cycles are forbidden unless the step declares a bounded loop. Reaching `maxIterations` emits `loop.limit_reached` and blocks the run.
12. Pure actions execute synchronously against pinned inputs and emit typed result events.
13. Effectful and AI actions use queued, running, succeeded, failed, timed-out, and cancelled lifecycle events with declared retry policy.
14. Replay consumes stored action results and never invokes actions or external effects.
15. Completion produces a dossier from the pinned protocol, event history, final projection, evidence, dissent, decision, approval, uncertainty, and review date.

### Action registry

Registry definitions declare the action key, input schema, result schema, execution class, timeout, retry behavior, and implementation version.

Pure actions include weighted scoring, ranked choice, pairwise comparison, and deterministic dossier assembly. Effectful actions include AI synthesis, reminders, exports, and external research. Only the actions required by the two proof protocols, plus one persisted AI synthesis action, are included in the first release.

AI results record the model and configuration identifiers, declared inputs, source links, uncertainty, and human edits. Schema-invalid output fails the action and cannot advance the run automatically.

## Persistence and Atomicity

Extend the Supabase backend with:

- `protocols`: stable identity, author, ownership, visibility, and lifecycle status.
- `protocol_versions`: immutable definition JSON, semantic and schema versions, checksum, and publication metadata.
- `protocol_runs`: decision, pinned version, status, revision, projection, checksum, and timestamps.
- `protocol_participants`: role assignments and invitation or completion state.
- `protocol_run_events`: append-only sequence, command idempotency key, actor, typed payload, and timestamp.
- `protocol_artifacts`: dossier and intermediate artifact metadata with source revision and checksum.
- `protocol_outbox`: effect, destination, claim, attempt, timeout, delivery state, and deduplication metadata.

Row-level security enforces protocol ownership, visibility, and run participation. The authoritative command handler is a Supabase Edge Function using the server-side TypeScript reducer.

The handler loads the pinned definition and current projection, validates and reduces the command, then calls a service-role-only Postgres function named `apply_protocol_command`. The function atomically:

1. Checks the expected revision.
2. Checks the command idempotency key.
3. Appends events and outbox rows.
4. Updates the projection, checksum, and revision.
5. Returns the committed result.

Execution privileges are revoked from `anon` and `authenticated` roles.

### Outbox delivery

External delivery is at-least-once. The worker claims an outbox item, records attempts, and supplies `effect_id` as the destination idempotency key. A unique `(effect_id, destination)` constraint prevents duplicate local scheduling, but a destination without idempotency support may still receive a duplicate if delivery succeeds and the worker fails before recording success. Replay never sends effects.

## Cross-Repository Compatibility

- The backend reducer is authoritative and consumes the contract workspace source.
- The frontend pins a published contract version.
- Both repositories execute the same Decision RFC and outside-protocol fixtures.
- CI fails when schemas, fixture projections, or checksums diverge.
- A contract release declares its supported definition and event schema versions.
- The backend accepts the current and immediately previous supported versions before a frontend using a new version deploys.
- Deployment order is contract package, backward-compatible backend, then frontend.

## Owner Experience

- Open directly on the active decision and its next required action.
- Show completed, active, blocked, parallel, and skipped protocol steps with reasons.
- Keep the strongest unresolved objection, missing evidence, pending role, and required owner response prominent.
- Keep protocol title, author, version, recommendation rationale, and inspector available for provenance.
- Separate trusted-author validation and preview from the owner workspace.
- Do not allow owners to edit raw protocol structure inside an active run.

## Failure Behavior

- Invalid or unknown constructs fail publication with actionable paths and errors.
- Unreachable steps, undeclared cycles, missing role coverage, ambiguous transitions, and missing completion paths block publication.
- Stale submissions return a revision conflict without discarding the user's draft.
- Duplicate commands return the original committed result without appending another event.
- Removing a required participant requires reassignment or an explicitly allowed skip.
- Failed actions preserve their inputs and remain retryable according to policy.
- Exhausted retries block the step and show an owner-visible escalation path.
- Invalid AI output is rejected or routed to human correction.
- A withdrawn protocol remains readable by existing pinned runs but cannot start new runs.
- Missing source evidence remains visible as unavailable metadata rather than appearing verified.
- Cancellation preserves the audit trail and records the actor and reason.

## Test Plan

### Contract and publication

- Validate all schemas, registries, role references, field renderers, actions, outputs, and expressions.
- Test reachability, completion paths, forks, joins, bounded loops, and transition arbitration.
- Test JSON and YAML imports canonicalize to the same validated JSON and checksum.
- Reject ambiguous mixed or equal-priority transition matches without explicit policies.

### Reducer and actions

- Exercise every command and event type through shared fixtures.
- Cover branches, parallel dependencies, skips, retries, timeouts, cancellation, and final completion.
- Prove replay reproduces the stored projection checksum without executing actions or effects.
- Verify pure action recomputation matches its stored result checksum.
- Verify schema-invalid AI output cannot advance a step.

### Persistence and security

- Test duplicate idempotency keys, stale revisions, and simultaneous submissions.
- Prove event append, outbox insertion, and projection update are atomic.
- Prove clients cannot invoke `apply_protocol_command` or write events and projections directly.
- Prove cross-user and cross-run isolation through row-level-security tests.
- Test outbox retry and destination idempotency behavior.

### Cross-repository and product acceptance

- Run identical protocol fixtures in frontend and backend CI.
- Test the current and immediately previous supported contract versions.
- Complete Decision RFC and the outside-authored protocol through the generic owner workspace.
- Confirm neither protocol introduces protocol-specific application branches.
- Confirm owners can identify the next required action without opening the protocol inspector.
- Confirm every dossier records protocol provenance, required and skipped steps, roles, evidence, dissent, rationale, approval, uncertainty, outcome, and review date.

## Success Criteria

- Two materially different protocols publish and run through one contract, validator, reducer, and interface.
- An outside practitioner can validate and preview a protocol without changing application code.
- An owner can move from a messy prompt to an explained protocol recommendation, assigned roles, completed workflow, final decision, and shareable dossier.
- Concurrent and duplicate submissions cannot corrupt a run or create duplicate events.
- Replaying all events reproduces the stored projection checksum.
- Backend authorization prevents participants from seeing or changing fields outside their roles.
- The owner understands the next required action while protocol machinery remains visible but secondary.

## Assumptions and First Assignment

- The accountable owner makes the final decision.
- Protocols are the core product primitive and remain typed, versioned, and attributable.
- Third-party authorability is part of the first proof; marketplace mechanics are deferred.
- Expansion is earned through completed, shared, and revisited dossiers rather than protocol count.
- Existing frontend and backend working-tree changes must be reconciled before implementation begins.

First assignment: choose one real consequential team decision with a deadline, three participants, one process approver, and a strongest known objection. Recruit one outside practitioner to author or adapt the second protocol.

The recommended next planning step is an engineering review that converts this design into session-sized roadmap changes without weakening the two-protocol proof.
