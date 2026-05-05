# Mock Schedule Engine Usage

This document explains how to use the mock Schedule Engine for backend and
frontend integration testing.

## Purpose

The mock engine returns schedule results in the same shape expected from the
future real rule/AI engines.

It is useful for testing integration before the full schedule engine is
implemented.

It does not:

- call Gemini
- write to MongoDB
- replace the final rule engine
- replace the final AI engine

## Import

```ts
import { createMockScheduleEngineResponse } from "@/lib/scheduleEngine";
```

## Basic Usage

```ts
const result = createMockScheduleEngineResponse({
  date: "2026-05-05",
  mode: "ai",
  tasks: [
    {
      id: "task-1",
      title: "Finish assignment draft",
      status: "todo",
      priority: "high",
      deadline: "2026-05-05",
      estimatedMinutes: 120,
    },
  ],
});
```

The result uses the agreed API-compatible shape:

```ts
{
  success: true,
  data: ScheduleBlockAPI[],
  meta: {
    requestedMode: "rule" | "ai",
    usedMode: "rule" | "ai",
    scheduledReasoning: [],
    overflow: [],
    unscheduled: []
  }
}
```

## Behavior

- Normal schedule window defaults to `09:00-17:00`.
- Overflow cap defaults to `22:00`.
- `rule` mode returns empty `scheduledReasoning`.
- `ai` mode returns mock scheduled reasoning.
- Tasks due on or before the schedule date may overflow after `17:00`.
- Non-must-complete tasks that cannot fit before `17:00` are returned in
  `meta.unscheduled`.
- Tasks that cannot fit before `22:00` are returned in `meta.unscheduled`.
- Occupied blocks with status `scheduled` or `completed` block time.

## Tests

Run:

```bash
npm run test
```

Current tests live in:

```text
lib/scheduleEngine/__tests__/mockEngine.test.ts
```

## Notes for Integration

Use the mock engine to verify that callers can handle:

- `data` schedule blocks
- `meta.scheduledReasoning`
- `meta.overflow`
- `meta.unscheduled`
- `requestedMode` and `usedMode`

Do not persist `meta` fields into `ScheduleBlock`. Reasoning is response-level
metadata only.

