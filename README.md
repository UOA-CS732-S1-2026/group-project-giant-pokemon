# TaskFlow AI

## 📋 What's New — 12th May 2026

*AI features (task parser, free time suggestions, user preference alignment) updated by Marvin Xu*

### 🤖 AI-Powered Natural Language Task Parser

- **Create tasks using plain English** — just describe what you need to do, AI handles the rest
- Example: *"Meeting at 10am, lunch at 12:30pm, pick up kids at 4pm, football at 6pm"*
- AI automatically extracts: title, priority, estimated duration, deadline, scheduled date & time
- Preview before saving — review then save with one click
- Page: `/tasks` (AI Quick Add section)

### 🧠 AI-Powered Free Time Suggestions

- **Intelligent activity suggestions** for every free slot in your timetable
- Categories: rest, exercise, learning, social, creative, mindfulness
- **Breaks long free slots into multiple smaller activities** (e.g., study → break → exercise → break → review)
- One-click "Add to Timetable" — suggested activities are instantly saved as scheduled tasks with:
  - **Title** (activity description)
  - **Start time** (matches the free slot start time)
  - **Duration** (intelligently calculated based on activity length)
  - **End time** (automatically derived from start time + duration)
- Page: `/timetable` (Free Time Suggestions section)

### 📝 Task Management — Enhanced with Time & Duration

- **Schedule tasks with specific times** — each task now supports:
  - `scheduledDate` — pick the exact date for your task
  - `scheduledStartTime` — set a precise start time (e.g., 10:00 AM)
  - `estimatedMinutes` — duration of the task (1-480 minutes)
- Tasks with scheduled time automatically appear in your Timetable at the correct position
- Manual task creation form includes all time fields
- Edit any task to modify its scheduled time or duration
- Page: `/tasks`

### 🎯 AI Suggestions Aligned with User Preferences

- AI reads your **Planning Preferences** from your profile and personalizes every suggestion:
  - **Working hours** — suggestions only within your preferred start/end time
  - **Workload capacity** — won't overschedule if you prefer a lighter load
  - **Focus style** — activity length matches Deep Work / Pomodoro / Short Bursts
  - **Break preference** — inserts breaks of your preferred length
  - **Main goal & active goals** — suggestions tie back to your goals
- Page: `/profile` — set your preferences once, AI uses them everywhere

### 📅 Timetable Module — Smart & Personalized

- **Dynamic time range** — automatically adjusts to your preferred working hours
- **Smart merged timeline** — free time slots are intelligently collapsed
- **Daily progress bar** — track completed vs. scheduled tasks
- Tasks with scheduled time appear exactly where you placed them
- Page: `/timetable`