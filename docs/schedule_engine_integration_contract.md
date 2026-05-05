# Schedule Engine Integration Contract

This document is for developers working on the Task module and the Scheduling
frontend. It defines the data shapes and behaviors needed to integrate with the
Schedule Engine.

The engine has two modes:

- `rule`: deterministic priority/deadline scheduling.
- `ai`: Gemini-backed scheduling with per-task reasoning.

Both modes use the same request and response contract.

## Shared Concepts

### Schedule generation mode

```ts
type ScheduleGenerationMode = "rule" | "ai";
```

If omitted, the backend defaults to `rule`.

Invalid mode values must be treated as request errors.

### Date format

All request dates and task deadlines use:

```ts
YYYY-MM-DD
```

Example:

```ts
"2026-05-05"
```

### Time format

Schedule block times use:

```ts
HH:mm
```

Examples:

```ts
"09:00"
"13:45"
```

The engine does not require 15-minute or 30-minute increments.

## Task Module Contract

The Schedule Engine needs tasks to be convertible into this normalized shape:

```ts
type SchedulableTask = {
  id: string;
  goalId?: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress";
  priority: "low" | "medium" | "high";
  deadline?: string;
  estimatedMinutes: number;
};
```

### Required task fields

Task module must provide:

- `id`
- `title`
- `status`
- `priority`

### Optional task fields

Task module may provide:

- `goalId`
- `description`
- `deadline`
- `estimatedMinutes`

### Field requirements

`id`

- Must be stable.
- Must be unique among tasks passed to the Schedule Engine.
- Must be the value used by `ScheduleBlock.taskId`.
- Must not be derived from title.

`title`

- Must be a non-empty string.
- Used for generated block title and user-facing metadata.

`status`

- Valid values for scheduling input:
  - `todo`
  - `in_progress`
- `completed` tasks must not be scheduled.
- If the Task module stores other statuses, map them before passing to the
  engine.

`priority`

- Must be one of:
  - `low`
  - `medium`
  - `high`
- Required because rule scheduling depends on it.

`deadline`

- Optional.
- If present, must use `YYYY-MM-DD`.
- A task is considered must-complete-today when:

```ts
deadline <= scheduleDate
```

Must-complete tasks may overflow past the normal day window.

`estimatedMinutes`

- Optional at the Task module level.
- Defaults to `60` when omitted.
- If present, must be between `1` and `480`.
- The engine will not change task duration.
- One task maps to at most one schedule block; task splitting is not supported.

### Task query expectations

When the real Task provider replaces mock tasks, it should return only tasks
that are eligible for scheduling:

- owned by the current user
- status is `todo` or `in_progress`
- not completed
- not deleted or archived

Recommended provider shape:

```ts
getSchedulableTasks({
  userId,
  date,
  requestTasks,
})
```

Provider priority:

1. Use `requestTasks` when present, for frontend testing.
2. Otherwise query real Task data.
3. Until Task module is ready, fallback to backend mock tasks.

### Task module edge cases

The engine expects invalid request tasks to produce `400`, not silent fallback.

Examples of invalid input:

- missing id
- duplicated id
- blank title
- missing priority
- invalid priority
- invalid status
- invalid deadline format
- invalid estimatedMinutes
- more than 50 tasks

## Scheduling Frontend Contract

The frontend should call the same endpoints for both rule and AI modes.

### Generate schedule

```http
POST /api/schedules/generate
```

Request:

```ts
type GenerateScheduleRequest = {
  date?: string;
  mode?: "rule" | "ai";
  tasks?: TaskInput[];
};
```

Example:

```json
{
  "date": "2026-05-05",
  "mode": "ai",
  "tasks": [
    {
      "id": "task-1",
      "title": "Finish assignment draft",
      "priority": "high",
      "deadline": "2026-05-05",
      "estimatedMinutes": 120
    }
  ]
}
```

### Regenerate missed tasks

```http
POST /api/schedules/regenerate
```

Request:

```ts
type RegenerateScheduleRequest = {
  date?: string;
  mode?: "rule" | "ai";
  tasks?: TaskInput[];
};
```

Regenerate matches missed schedule blocks using:

```ts
missedBlock.taskId === task.id
```

Do not rely on title matching.

If a missed block has no `taskId`, it is treated as a manual/custom block and is
not replanned by the engine.

### Frontend task input shape

For testing and integration, frontend may pass this shape:

```ts
type TaskInput = {
  id: string;
  goalId?: string;
  title: string;
  description?: string;
  status?: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  deadline?: string;
  estimatedMinutes?: number;
};
```

Notes:

- `status` may be omitted; backend defaults it to `todo`.
- `completed` tasks are filtered out.
- `priority` is required.
- `id` is required and must be stable.
- `estimatedMinutes` defaults to `60`.

### Successful response

The backend returns:

```ts
type ScheduleEngineResponse = {
  success: true;
  data: ScheduleBlock[];
  meta: ScheduleGenerationMeta;
};
```

Schedule block shape:

```ts
type ScheduleBlock = {
  _id: string;
  userId: string;
  taskId?: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "completed" | "missed";
  createdAt: string;
  updatedAt: string;
};
```

Generation metadata:

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

### Frontend handling requirements

Frontend should:

- Provide a mode selector for `rule` and `ai`.
- Send current task input list in `tasks` when testing custom scenarios.
- Display `meta.usedMode`, especially when AI falls back to rule.
- Display `meta.fallback.message` when present.
- Display AI scheduled reasoning by matching:

```ts
block.taskId === scheduledReasoning.taskId
```

- Display `meta.overflow` so users know which tasks were scheduled after the
  normal day window.
- Display `meta.unscheduled` so users know which tasks could not be scheduled.
- Store reasoning client-side if it must survive refresh; reasoning is not
  persisted by the backend.

Frontend should not:

- Assume AI mode always returns AI results.
- Assume every block has reasoning.
- Persist reasoning into `ScheduleBlock`.
- Use task title to match reasoning or missed tasks.
- Send invalid tasks expecting backend fallback to mock data.

## Scheduling Behavior to Reflect in UI

Normal scheduling window:

```text
09:00-17:00
```

Overflow cap:

```text
22:00
```

Only must-complete tasks can overflow.

A must-complete task is:

```ts
deadline <= scheduleDate
```

Tasks that still cannot fit before `22:00` appear in `meta.unscheduled`.

The engine does not split tasks.

The engine does not change `estimatedMinutes`.

## Persistence Expectations

The backend persists schedule blocks, but not reasoning.

Generate keeps the current persistence semantics:

- delete selected date's `scheduled` and `missed` blocks
- preserve `completed` blocks
- insert newly generated blocks

Regenerate:

- replans matched missed task blocks
- preserves non-replanned blocks
- preserves missed manual blocks without `taskId`

## Error Handling

Invalid user input should return `400`.

Examples:

- invalid `mode`
- invalid `date`
- invalid task field
- duplicate task id
- too many tasks

AI failures should not usually return an error response. They should fallback to
rule mode and return:

```ts
meta.requestedMode = "ai"
meta.usedMode = "rule"
meta.fallback = { code, message }
```

## User-Level Availability Settings

First implementation uses defaults:

- normal window: `09:00-17:00`
- overflow cap: `22:00`

Future User/Profile settings should support custom availability windows.

When that feature is added, Scheduling frontend and Task module should not
change the engine request/response contract. The backend should resolve
availability from user settings before invoking the engine.

## Integration Checklist

Task module is ready for integration when:

- tasks have stable ids
- tasks expose priority and status
- completed tasks can be filtered out
- deadline uses `YYYY-MM-DD`
- estimated duration is available or can be omitted safely

Scheduling frontend is ready for integration when:

- users can choose `rule` or `ai`
- frontend can send task inputs for testing
- generated blocks render from `data`
- reasoning/overflow/unscheduled render from `meta`
- AI fallback state is visible
- reasoning is stored client-side only if needed

