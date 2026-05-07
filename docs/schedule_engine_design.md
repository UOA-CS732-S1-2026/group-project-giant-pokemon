# Schedule Engine Design

This document records the agreed design decisions for the Schedule Engine work
on `feat/schedule-engine`.

## Version History

### v0.2 - AI preference-based rescheduling

Changes from v0.1:

- Clarifies that Rule and AI engines keep one public input/output contract even
  though their internal strategies differ.
- Adds user scheduling instruction as the input that allows AI mode to deviate
  from the deterministic rule baseline.
- Defines AI mode as a constrained adjustment layer over a rule-generated
  baseline, not an unconstrained replacement scheduler.
- Classifies constraints into hard constraints, strong preferences, and soft
  preferences.
- Requires AI mode to fallback to rule mode if user instruction, model output,
  validation, or provider execution cannot produce a safe schedule.
- Clarifies that Rule mode remains deterministic and cannot express subjective
  preferences such as "move some low-priority warm-up tasks earlier."

### v0.1 - Baseline two-mode schedule engine

Initial agreed design:

- Two modes: deterministic `rule` and Gemini-backed `ai`.
- Shared response shape with `data` and `meta`.
- Rule scheduling by priority, deadline, default window, overflow, and occupied
  blocks.
- AI scheduling with JSON-only output, validation, per-block reasoning, and
  fallback to rule.
- Reasoning returned in response metadata only, not persisted.
- Request task provider supports frontend-supplied tasks first, then backend
  mock tasks, later real Task module.

## Scope

Implement two backend schedule generation modes:

- `rule`: deterministic generation based on task priority and deadline.
- `ai`: Gemini-backed generation with per-block reasoning.

The frontend testing page may be changed locally to exercise both modes, but the
schedule engine commit should focus on backend engine code, API changes, tests,
and required configuration.

## Design Principles

### Rule and AI share one contract

Rule mode and AI mode must use the same request shape and response shape.

Both modes are selected with:

```ts
mode: "rule" | "ai"
```

Both modes return:

```ts
{
  success: true;
  data: ScheduleBlock[];
  meta: ScheduleGenerationMeta;
}
```

This keeps frontend code, API routes, persistence, and tests from splitting into
two separate implementations.

The engines may use different internal strategies:

- Rule mode ignores user preference instructions and follows deterministic
  priority/deadline rules.
- AI mode may use user instructions, reasoning, and a rule baseline to adjust
  the schedule.

These differences must stay behind the shared engine contract.

### Engines generate; routes persist

Schedule engines do not read or write MongoDB directly.

Engines return plain generated results. API routes or orchestration code own:

- request parsing
- task provider resolution
- engine selection
- fallback handling
- schedule block deletion/insertion
- response assembly

This keeps engine logic pure and testable.

### Rule mode is the reliable baseline

Rule mode must be deterministic, network-free, and always available.

It is both:

- the explicit `rule` generation mode
- the fallback path when AI mode cannot safely produce a valid schedule
- the baseline plan AI mode uses before applying user preference instructions

### AI is an enhancement, not a dependency

AI mode may improve scheduling quality and provide reasoning, but the product
must still return a useful schedule when AI is unavailable or invalid.

AI mode is responsible for preference-based rescheduling, especially when the
user is dissatisfied with the rule output for subjective reasons. Examples:

- "Move some low-priority tasks earlier because they are easy warm-up tasks."
- "Keep the morning lighter."
- "Group similar admin tasks together."
- "Avoid doing two long focus tasks back to back."

These requests should not expand the Rule engine into a large set of preference
switches. Instead, AI mode uses the user instruction to justify safe deviations
from the rule baseline.

AI mode falls back to rule mode when:

- `GEMINI_API_KEY` is missing
- the Gemini request fails
- the Gemini request times out
- the response is not valid JSON
- the response fails validation
- required reasoning is missing
- tasks are not fully accounted for
- the user instruction is missing when AI rescheduling requires one
- the AI output violates any hard scheduling constraint

Fallback responses keep `requestedMode: "ai"` and use `usedMode: "rule"`.

### AI output is never trusted directly

AI output must be parsed and validated before any schedule block is persisted.

The validator enforces task identity, duration, time bounds, occupied blocks,
overflow rules, and output coverage. Any critical validation failure falls back
to rule mode rather than partially accepting AI output.

### Reasoning is response metadata

Reasoning is not part of the persisted `ScheduleBlock` model.

AI reasoning is returned in `meta` for the frontend to display or store locally.
Rule mode can leave `scheduledReasoning` empty but should still return
deterministic `overflow` and `unscheduled` reasons.

### Scheduling constraints are shared

Rule and AI modes must follow the same scheduling constraints:

- default normal window: `09:00-17:00`
- overflow cap: `22:00`
- only `deadline <= scheduleDate` tasks may overflow
- task duration cannot be changed
- tasks are not split
- one task maps to at most one generated block
- tasks that still cannot fit are returned as unscheduled

AI cannot invent exceptions to these rules.

### AI deviations require instruction

AI mode should stay close to the rule baseline when no user instruction is
provided.

When the user wants a different schedule, the frontend should collect an
instruction explaining why the rule result should change. That instruction is a
first-class scheduling input, not decorative prompt text.

The instruction allows AI mode to change soft preferences while preserving hard
constraints.

### Constraint hierarchy

Hard constraints must always be enforced by both Rule and AI modes:

- Fixed blocks cannot move.
- Completed blocks cannot move.
- Generated blocks must not overlap occupied or fixed blocks.
- Task duration cannot change.
- Tasks cannot be split.
- A task can appear at most once in generated blocks.
- Generated blocks must use valid `HH:mm` times.
- Only must-complete tasks may overflow past the normal window.
- No task can go beyond the overflow cap.
- AI cannot create tasks, rename tasks, or use unknown task ids.

`Fixed` is a scheduling/orchestration concept: once the API supports explicit
fixed blocks, the orchestrator should pass them to engines as occupied blocks
and preserve them during persistence. It should not require changing the core
engine output shape.

Strong preferences should be followed unless the user instruction explicitly
asks for a safe deviation:

- Higher priority tasks are generally earlier than lower priority tasks.
- Earlier deadlines are generally earlier than later deadlines.
- Must-complete-today tasks should be scheduled if any valid slot exists.

Soft preferences are where AI mode may provide value:

- Move easy low-priority tasks earlier as warm-up work.
- Keep cognitively hard tasks in preferred parts of the day.
- Group similar tasks.
- Leave buffer between demanding tasks.
- Avoid long uninterrupted runs of work.

### Inputs are normalized before scheduling

Engines operate on normalized `SchedulableTask` objects, not raw request data or
database documents.

Provider priority:

1. request body tasks, when present
2. backend mock tasks
3. future real Task model provider

Invalid request tasks return `400`; do not silently switch to mock tasks.

### Regenerate only replans explicit task matches

Regenerate matches missed schedule blocks to tasks using `block.taskId`.

It does not match by title. If a missed block cannot be matched to a provided
task, the block is preserved and the response includes an unscheduled reason.

### Defaults work now; user-level settings come later

The first implementation uses default windows, but available time should be
modeled as a future user-level configuration concept.

The engine design should leave room for later user-specific schedule settings
without changing the core Rule/AI contract.

### Tests focus on pure engine behavior

Unit tests should prioritize deterministic backend logic:

- rule engine behavior
- task normalization and validation
- AI output validation
- Gemini client behavior with mocked `fetch`
- prompt builder constraints

Do not rely on the React UI or real Gemini network calls to validate core engine
correctness.

## API Entry Points

Use the existing schedule endpoints and add a `mode` field.

```ts
type ScheduleGenerationMode = "rule" | "ai";
```

Generate:

```http
POST /api/schedules/generate
```

Regenerate:

```http
POST /api/schedules/regenerate
```

Request body:

```ts
type ScheduleEngineRequest = {
  date?: string; // YYYY-MM-DD, defaults to today
  mode?: "rule" | "ai"; // defaults to "rule"
  tasks?: TaskInput[]; // optional test input from the browser page
  instruction?: string; // optional; used by AI preference rescheduling
};
```

Response shape remains compatible with current APIs:

```ts
type ScheduleEngineResponse = {
  success: true;
  data: ScheduleBlock[];
  meta: ScheduleGenerationMeta;
};
```

## Task Provider

Introduce a task provider abstraction.

```ts
getSchedulableTasks({
  userId,
  date,
  requestTasks,
})
```

Input priority:

1. If `requestTasks` is present, validate and normalize those tasks.
2. If `requestTasks` is absent, fall back to backend mock tasks.
3. Later, the fallback can be replaced by real Task model queries.

The API accepts a flexible task input shape but normalizes into one internal
type.

```ts
type SchedulableTask = {
  id: string;
  goalId?: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress";
  priority: "low" | "medium" | "high";
  deadline?: string; // YYYY-MM-DD
  estimatedMinutes: number;
};
```

Validation decisions:

- `id` is required.
- `title` is required.
- `priority` is required.
- `estimatedMinutes` defaults to `60` when omitted.
- `estimatedMinutes` must be from `1` to `480` when present.
- `status` is optional; omitted status defaults to `todo`.
- `completed` tasks are filtered out.
- `deadline`, when present, must use `YYYY-MM-DD`.
- Invalid request tasks return `400`; do not silently fall back to mock tasks.
- Request task limit is `50`.

## Rule Engine

Rule mode is deterministic.

Sorting:

1. Priority: `high > medium > low`.
2. Within the same priority, earlier `deadline` first.
3. Tasks without deadline are placed after tasks with deadline.
4. Same priority and same deadline keep input order.

Scheduling window:

- Normal day window: `09:00-17:00`.
- Missing `estimatedMinutes`: `60`.
- A task is not split; one task maps to at most one block.
- Available window should be treated as a user-level configuration concept.
- First implementation can use defaults, but engine types should leave room for
  future user-specific custom windows.

Overflow:

- A task is considered must-complete-today when `deadline <= scheduleDate`.
- First try to place all tasks inside `09:00-17:00`.
- Must-complete tasks that do not fit can overflow after `17:00`.
- Overflow hard cap: `22:00`.
- If a must-complete task still cannot fit before `22:00`, it is unscheduled.

Occupied blocks:

- Engine supports occupied blocks.
- `scheduled` and `completed` blocks occupy time.
- Missed blocks selected for regeneration do not occupy time.
- Current generate API persistence semantics remain unchanged: delete the
  selected date's `scheduled` and `missed` blocks, preserve `completed`.

## AI Engine

AI mode uses Gemini.

AI mode is a constrained preference-adjustment layer:

1. Generate a rule baseline using the same normalized input.
2. Send tasks, occupied/fixed blocks, schedule window, rule baseline, and user
   instruction to the model.
3. Validate the model output against the shared hard constraints.
4. Return the validated AI schedule with reasoning.
5. Fallback to the rule baseline if anything unsafe or invalid occurs.

AI mode should not be treated as a separate scheduling product with a separate
API shape.

Provider decisions:

- Use Gemini.
- Call Gemini through REST `fetch`, not an SDK.
- Endpoint base URL is configurable.
- Env vars:
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL`
  - `GEMINI_API_BASE_URL`
- If `GEMINI_API_BASE_URL` is missing, default to
  `https://generativelanguage.googleapis.com/v1beta`.
- If `GEMINI_MODEL` is missing, default to `gemini-3-flash-preview`.
- AI request timeout is `10` seconds.
- Do not retry failed AI requests.
- Do not return raw AI responses to clients.
- If AI generation fails, fallback to rule mode.
- If `GEMINI_API_KEY` is missing, fallback to rule mode.

Gemini request decisions:

- Prompt must require JSON-only output.
- Use Gemini `generationConfig` with:
  - `responseMimeType: "application/json"`
  - `temperature: 0.2`
- Prompt includes:
  - schedule date
  - user instruction, when provided
  - tasks
  - rule baseline blocks
  - normal window `09:00-17:00`
  - overflow cap `22:00`
  - occupied blocks
  - no task splitting
  - no duration changes
  - do not create tasks
  - do not rename tasks
  - use only provided task ids
  - only must-complete tasks may overflow
  - keep close to the rule baseline unless the instruction justifies a
    deviation
  - explain meaningful deviations in scheduled reasoning
- Prompt includes schedule date only; no runtime datetime/timezone.

JSON parsing:

- Try `JSON.parse` first.
- If parsing fails, allow fenced `json` code block extraction.
- Do not parse arbitrary natural language.

AI validation:

- JSON must parse.
- `taskId` must come from input tasks.
- Each scheduled task appears at most once.
- `startTime` and `endTime` must be `HH:mm`.
- Duration must equal the task's `estimatedMinutes`.
- Scheduled blocks must not overlap occupied blocks.
- Normal tasks cannot go beyond `17:00`.
- Must-complete tasks may overflow to `22:00`.
- No task can end after `22:00`.
- Status is always `scheduled`.
- AI must account for all tasks as scheduled, overflow, or unscheduled.
- Every successful AI scheduled task must have scheduled reasoning.
- A task cannot appear in both scheduled and unscheduled output.
- AI output must not move fixed or completed blocks.
- AI output must not omit required reasoning for meaningful deviations from the
  rule baseline.
- If any critical validation fails, fallback the entire result to rule mode.

Instruction behavior:

- If `mode: "ai"` is requested without an instruction, AI may still run but
  should stay close to the rule baseline.
- If the user's desired change cannot be expressed safely, return fallback rule
  output or validated AI output with unscheduled reasons rather than violating
  constraints.
- The backend should include the instruction in prompts only after normalization
  and length checks.

## Reasoning and Meta

Reasoning is returned in API response metadata only.

It is not persisted to MongoDB.

The frontend testing page is responsible for storing and displaying reasoning if
needed.

Rule mode:

- `scheduledReasoning` can be empty.
- `unscheduled` and `overflow` metadata should still be returned.
- Rule overflow/unscheduled reasons are deterministic strings from the backend.

AI mode:

- Return per scheduled block reasoning.
- Return overflow and unscheduled reasons.
- Do not return a repeated overall strategy; the strategy is stable.

Meta shape:

```ts
type ScheduleGenerationMeta = {
  requestedMode: "rule" | "ai";
  usedMode: "rule" | "ai";
  fallback?: {
    code:
      | "missing_api_key"
      | "request_failed"
      | "timeout"
      | "invalid_response"
      | "validation_failed";
    message: string;
  };
  scheduledReasoning: Array<{
    taskId: string;
    title: string;
    reasoning: string;
  }>;
  overflow: Array<{
    taskId: string;
    title: string;
    reason: string;
  }>;
  unscheduled: Array<{
    taskId: string;
    title: string;
    reason: string;
  }>;
};
```

AI fallback behavior:

- Return rule-generated blocks.
- `requestedMode` remains `ai`.
- `usedMode` becomes `rule`.
- Include structured fallback code/message.
- Include rule `unscheduled` and `overflow` metadata.
- Fallback rule blocks are still persisted to MongoDB.

Reasoning coverage:

- Rule and fallback-rule responses use `scheduledReasoning: []`.
- Successful AI responses must include reasoning for every newly generated task
  block.
- Preserved completed/manual blocks do not need scheduled reasoning.
- `preservedBlockIds` are not included in metadata.

## Regenerate

Regenerate supports both modes.

```ts
POST /api/schedules/regenerate
{
  date?: string;
  mode?: "rule" | "ai";
  tasks?: TaskInput[];
  instruction?: string;
}
```

Behavior:

- Find missed blocks for the selected date.
- Match missed `block.taskId` to normalized task `id`.
- Only matched missed tasks are replanned.
- Do not match by title.
- If request tasks are provided and a missed task id is missing from that input,
  keep the missed block and return an unscheduled reason.
- Missed blocks without `taskId` are preserved and not replanned.
- Preserve non-replanned existing blocks as occupied blocks.
- AI reasoning only covers newly generated/replanned blocks.
- In AI mode, `instruction` can request preference-based adjustments for the
  replanned tasks, but existing preserved blocks remain hard constraints.

## Persistence

Engines do not write to MongoDB.

The route/orchestrator owns persistence:

- Parse request.
- Resolve tasks through provider.
- Choose rule or AI engine.
- Fallback if needed.
- Delete/insert schedule blocks according to existing API semantics.
- Return `{ success, data, meta }`.

Invalid mode:

- Invalid `mode` values return `400`; do not silently default to rule.

Time granularity:

- Any valid `HH:mm` value is allowed.
- Rule engine may generate non-15-minute times such as `09:45`.
- AI output is valid if the duration matches the task's `estimatedMinutes`.

## Testing

Introduce Vitest now because schedule engine logic is core and rule-heavy.

Test framework:

- Vitest.
- Add scripts:
  - `test`: `vitest run`
  - `test:watch`: `vitest`

Test location:

```text
lib/scheduleEngine/__tests__/
```

Test scope:

- Rule engine pure function behavior.
- Task provider normalization and validation.
- AI output validator.
- Gemini client using mocked `fetch`; no real network calls.
- Prompt builder includes key constraints, not full snapshot text.

Do not test in first pass:

- React UI.
- Real Gemini calls.
- Full API route integration.

Vitest configuration:

- Add `vitest.config.ts`.
- Configure alias `@` for project-root imports.

## Planned File Organization

Add:

```text
lib/scheduleEngine/
  types.ts
  taskProvider.ts
  ruleEngine.ts
  aiEngine.ts
  geminiClient.ts
  scheduleEngine.ts
  __tests__/
```

Keep:

- `lib/scheduler.ts` as shared schedule/date/time utilities.

Update:

- `app/api/schedules/generate/route.ts`
- `app/api/schedules/regenerate/route.ts`
- `.env.example`
- `package.json`
- `package-lock.json`
- `vitest.config.ts`

Install:

- `vitest` as a dev dependency.

Do not include in schedule-engine commits:

- Browser-only testing page changes.
- Personal workflow notes.
