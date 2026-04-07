# Taskflow Goal Management Baseline

This version is a baseline implementation of the Goal Management module for the team project.

The project stack:
- Next.js
- TypeScript
- MongoDB Atlas
- Mongoose

## Purpose
This baseline is intended to:

- establish a full-stack foundation for the project
- align development with the intended final tech stack
- provide a reference structure for future modules

## Current Scope
This version currently includes:

- Goal model with Mongoose
- MongoDB connection setup
- Goal CRUD APIs (Incomplete)
- Basic goal management UI

### Implemented APIs

- `GET /api/goals`
- `POST /api/goals`
- `PUT /api/goals/[id]`
- `DELETE /api/goals/[id]`

## Project Structure
```bash
app/
  api/
    goals/
      route.ts
      [id]/
        route.ts
  goals/
    page.tsx
  layout.tsx
  page.tsx

components/
  goals/
    GoalForm.tsx
    GoalList.tsx

lib/
  mongodb.ts

models/
  Goal.ts

types/
  goal.ts
