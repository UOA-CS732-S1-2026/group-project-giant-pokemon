# Scheduling Module Implementation

This document describes the Scheduling module currently implemented on the
`feat/scheduling-module` branch.

## Current Scope

The Scheduling MVP includes:

- Persistent schedule blocks stored in MongoDB with Mongoose.
- Server-side mock Task input while the real Task module is not available.
- Rule-based daily schedule generation.
- Schedule regeneration for missed task blocks.
- CRUD APIs for schedule blocks.
- A basic `/schedules` management page.
- A browser-only test Task Input list on the `/schedules` page.
- A home page link to Schedule Management.

The real User, Task, and Goal integrations are not implemented in this branch.

## Default Settings

- User identity is mocked as `demo-user`.
- Daily available time is fixed from `09:00` to `17:00`.
- Missing task `estimatedMinutes` defaults to `60` minutes.
- Schedule block time fields use `HH:mm` format.
- Schedule dates are accepted as `YYYY-MM-DD` and stored as midnight UTC dates.
- MVP does not perform complex conflict detection for manual schedule edits.
- The `/schedules` page currently stores its test tasks and schedule edits in
  browser `localStorage`; those page-level testing changes are not written to
  MongoDB.

## Data Model

The module adds `ScheduleBlock` in `models/ScheduleBlock.ts`.

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

Client-facing types are defined in `types/schedule.ts`.

## Mock Task Provider

The upstream Task module is mocked in `lib/mockTasks.ts`.

Mock tasks include:

- `id`
- `goalId?`
- `title`
- `status`
- `priority`
- `deadline?`
- `estimatedMinutes?`

Only tasks with status `todo` or `in_progress` are returned for scheduling.
Completed mock tasks are excluded.

The provider exposes:

- `getActiveMockTasks()`
- `getActiveMockTasksByIds(taskIds)`

These functions are intended to be replaced later by real Task model queries
without changing the schedule generation API shape.

## Scheduling Rules

Core scheduling logic lives in `lib/scheduler.ts`.

Generation behavior:

- Sort active tasks by priority first: `high > medium > low`.
- For tasks with the same priority, schedule earlier deadlines first.
- Start scheduling at `09:00`.
- Stop scheduling after `17:00`.
- Skip tasks that cannot fit into the remaining available time.
- Create generated blocks with status `scheduled`.

Generate semantics:

- `POST /api/schedules/generate` deletes the selected date's existing
  `scheduled` and `missed` blocks for `demo-user`.
- Existing `completed` blocks are preserved.
- New generated task blocks are inserted around preserved completed blocks.

Regenerate semantics:

- `POST /api/schedules/regenerate` only replans missed blocks that are linked to
  active mock tasks.
- Non-missed blocks are preserved.
- Missed blocks whose tasks can be replanned are removed and recreated in
  available gaps.

## API Endpoints

### `GET /api/schedules?date=YYYY-MM-DD`

Returns schedule blocks for `demo-user` on the selected date, sorted by
`startTime`.

If `date` is omitted, the API uses today's date.

### `POST /api/schedules/generate`

Generates a daily schedule from active mock tasks.

Request body:

```json
{
  "date": "2026-05-04"
}
```

`date` is optional. If omitted, today's date is used.

### `POST /api/schedules`

Creates a manual schedule block.

Request body:

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

`taskId` is optional. This allows custom blocks that are not linked to a task.

### `PATCH /api/schedules/[id]`

Updates a schedule block owned by `demo-user`.

Supported fields:

- `title`
- `date`
- `startTime`
- `endTime`
- `status`
- `taskId`

The API validates date format, time format, valid time range, and status.

### `DELETE /api/schedules/[id]`

Deletes a schedule block owned by `demo-user`.

### `POST /api/schedules/regenerate`

Replans missed task blocks for a selected date.

Request body:

```json
{
  "date": "2026-05-04"
}
```

`date` is optional. If omitted, today's date is used.

## UI

The Scheduling page is implemented at `app/schedules/page.tsx`.

It provides:

- A left-side Task Input list for browser-only testing.
- Manual task add/delete controls.
- A schedule date picker.
- Generate Daily Schedule button.
- Regenerate Missed Tasks button.
- Manual schedule block form.
- Daily schedule list.
- Status updates for each block.
- Delete action for each block.

Supporting components:

- `components/schedules/TaskInputList.tsx`
- `components/schedules/ScheduleForm.tsx`
- `components/schedules/ScheduleList.tsx`

The home page includes a link to `/schedules`.

### Browser-only Task Input Test Mode

The `/schedules` page does not call the schedule APIs for the interactive
testing flow. Instead:

- Task inputs are stored under `taskflow:schedules:test-tasks`.
- Schedule blocks are stored under `taskflow:schedules:test-blocks`.
- Generate Daily Schedule uses the current browser task list as input.
- Deleting a task removes it from future generation input only.
- Refreshing the page keeps local test data in the same browser.
- Clearing browser storage resets the page to the default mock task list.

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

Open:

```text
http://localhost:3000/schedules
```

## Validation Performed

The Scheduling implementation was verified with:

```bash
npm run lint
MONGODB_URI=mongodb://localhost:27017/taskflow npm run build
```

Known lint warnings from pre-existing code:

- `GoalStatus` is imported but unused in `app/goals/page.tsx`.
- `buffer` is imported but unused in `lib/mongodb.ts`.

Manual API verification:

- `POST /api/schedules/generate` successfully creates schedule blocks.
- `GET /api/schedules?date=YYYY-MM-DD` returns generated blocks.
