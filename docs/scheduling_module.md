# Scheduling Module Overview

This document summarizes the Scheduling module's production-facing backend
surface. Detailed Schedule Engine behavior is maintained separately in
`docs/schedule_engine_design.md`; Task and frontend integration requirements are
maintained in `docs/schedule_engine_integration_contract.md`.

## Scope

The Scheduling module provides:

- Persistent schedule blocks stored in MongoDB with Mongoose.
- CRUD APIs for schedule blocks.
- Schedule generation and regeneration APIs.
- Rule and AI schedule generation through the shared Schedule Engine contract.
- Server-side mock Task input until the real Task module is integrated.

The first implementation uses a fixed demo user while auth/user integration is
pending.

## Defaults

- User identity: `demo-user`.
- Normal schedule window: `09:00-17:00`.
- Overflow cap: `22:00`.
- Missing task `estimatedMinutes`: `60`.
- Request dates and task deadlines: `YYYY-MM-DD`.
- Schedule block times: `HH:mm`.
- Schedule dates are stored as midnight UTC `Date` values.

## Data Model

The persistent model is `ScheduleBlock` in `models/ScheduleBlock.ts`.

```ts
type ScheduleBlock = {
  _id: string;
  userId: string;
  taskId?: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: "scheduled" | "completed" | "missed";
  createdAt: Date;
  updatedAt: Date;
};
```

Validation rules:

- `userId`, `title`, `date`, `startTime`, and `endTime` are required.
- `title` is trimmed and limited to 100 characters.
- `startTime` and `endTime` must match `HH:mm`.
- `status` must be `scheduled`, `completed`, or `missed`.

Reasoning, AI fallback details, and other generation metadata are returned in
API response `meta` only. They are not persisted in `ScheduleBlock`.

`Fixed` is not a persisted `ScheduleBlock` field. It is an orchestration concept
for preserving blocks during generation workflows.

## APIs

### `GET /api/schedules?date=YYYY-MM-DD`

Returns schedule blocks for `demo-user` on the selected date, sorted by
`startTime`. If `date` is omitted, today's date is used.

### `POST /api/schedules`

Creates a manual schedule block.

```json
{
  "title": "Team meeting",
  "date": "2026-05-04",
  "startTime": "15:00",
  "endTime": "16:00",
  "status": "scheduled",
  "taskId": "optional-task-id"
}
```

`taskId` is optional, allowing custom blocks that are not linked to a task.

### `PATCH /api/schedules/[id]`

Updates a schedule block owned by `demo-user`.

Supported fields:

- `title`
- `date`
- `startTime`
- `endTime`
- `status`
- `taskId`

The API validates date format, time format, time range, and status.

### `DELETE /api/schedules/[id]`

Deletes a schedule block owned by `demo-user`.

### `POST /api/schedules/generate`

Generates and persists a schedule for the selected date.

```ts
type GenerateScheduleRequest = {
  date?: string;
  mode?: "rule" | "ai";
  tasks?: TaskInput[];
  instruction?: string;
};
```

Persistence behavior:

- Preserves existing `completed` blocks.
- Deletes existing `scheduled` and `missed` blocks after engine generation
  succeeds.
- Inserts newly generated blocks.
- Returns `{ success, data, meta }`.

### `POST /api/schedules/regenerate`

Regenerates missed task blocks for the selected date.

```ts
type RegenerateScheduleRequest = {
  date?: string;
  mode?: "rule" | "ai";
  tasks?: TaskInput[];
  instruction?: string;
};
```

Persistence behavior:

- Matches missed blocks to tasks by `taskId`.
- Replans only matched missed task blocks.
- Preserves non-replanned blocks as occupied time.
- Preserves missed manual blocks without `taskId`.
- Deletes replaced missed blocks after engine generation succeeds.
- Inserts newly generated blocks.
- Returns `{ success, data, meta }`.

## Task Input

Until the real Task module is integrated, the backend can use mock tasks.
Generation endpoints may also receive request-provided tasks for integration
testing.

Tasks are normalized into the Schedule Engine shape:

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

Normalization rules:

- `status` defaults to `todo`.
- `completed` tasks are filtered out.
- `estimatedMinutes` defaults to `60`.
- `estimatedMinutes` must be an integer from `1` to `480`.
- `deadline`, when present, must use `YYYY-MM-DD`.
- Duplicate task ids are rejected.
- Request task lists are limited to 50 tasks.

## Engine Integration

Scheduling routes use the Schedule Engine through an orchestration layer:

- Parse and validate request input.
- Resolve schedulable tasks.
- Select `rule` or `ai` mode.
- Generate blocks and metadata.
- Persist blocks according to generate/regenerate semantics.
- Return schedule blocks and generation `meta`.

The engine itself does not read or write MongoDB.

## Local Development

The app expects MongoDB through `MONGODB_URI`.

Recommended local `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/taskflow
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3-flash-preview
```

A local MongoDB instance can be run with Docker:

```bash
docker run -d --name taskflow-local-mongo \
  -p 27017:27017 \
  -v taskflow-local-mongo-data:/data/db \
  mongo:7
```

Then start the app:

```bash
npm run dev
```

## Related Documents

- `docs/schedule_engine_design.md`: Rule/AI engine design, fallback behavior,
  reasoning metadata, and scheduling constraints.
- `docs/schedule_engine_integration_contract.md`: Task module and frontend
  integration contract.
