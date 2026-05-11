📋 What's New — 9th May 2026

Task Management Module ✅

Full CRUD operations (Create, Read, Update, Delete)
User isolation — each user sees only their own tasks
Schedule Engine ready (priority, status, estimated minutes, deadline)
Pages: /tasks (task management), /dashboard (landing with navigation cards)


Schedule Module ✅

Tasks from the database are automatically loaded and passed to the schedule engine — no manual input required
Supports both Rule mode and AI mode scheduling
Each task is guaranteed to appear at most once per day
Fixed blocks (e.g. lunch, meetings) can be manually added and are treated as occupied time by the engine
Clear All button to wipe all blocks for the current date in one click
Fully connected to the real database


Timetable Module ✅ (New)

New /timetable page with a smart merged timeline view
Free time slots are intelligently collapsed — no large empty grids
Free block height scales dynamically with duration for better readability
Task cards have color themes for quick visual distinction
Clear All button
Fully connected to the real database


AI Schedule Engine ✅

Audit logging added to verify real Gemini API calls at runtime — model name, prompt length, and raw response are printed to the terminal on every request
Rule mode available for testing without an API key


🔑 API Key Note
To test AI scheduling mode, add your own GEMINI_API_KEY to .env.local. Without it the engine falls back to Rule mode automatically. Rule mode is recommended for general testing.

⚠️ Work in Progress
Core data flow is fully operational: Task → Schedule Engine → Schedule Blocks → Timetable. This is the initial integration milestone, not the final version. Ongoing work includes UI/UX refinements, improved user interaction flows, and feature expansion. Updates will be pushed continuously.



Welcome to the CS732 project. We look forward to seeing the amazing things you create this semester! This is your team's repository.

Your team members are:
- Khushba Ahmed _(kahm047@aucklanduni.ac.nz)_
- Shardul Mangesh Anagal _(sana691@aucklanduni.ac.nz)_
- Sreelakshmi Gireesh _(sgir748@aucklanduni.ac.nz)_
- Harsh Kumar _(hkmu884@aucklanduni.ac.nz)_
- Marvin Xu _(zxu734@aucklanduni.ac.nz)_
- Chao Yao _(cyao907@aucklanduni.ac.nz)_

You have complete control over how you run this repo. All your members will have admin access. The only thing setup by default is branch protections on `main`, requiring a PR with at least one code reviewer to modify `main` rather than direct pushes.

Please use good version control practices, such as feature branching, both to make it easier for markers to see your group's history and to lower the chances of you tripping over each other during development

![](./Giant%20Pokemon.png)

## Docker

This project can run as a production-style Docker container with MongoDB via
Docker Compose.

```bash
docker compose up --build
```

Then open http://localhost:3000.

The Compose setup provides `MONGODB_URI=mongodb://mongo:27017/taskflow` to the
app container and persists MongoDB data in the `mongo-data` volume. MongoDB is
kept on Docker's internal network, so it will not conflict with a local MongoDB
already using port 27017.

Useful commands:

```bash
docker compose down
docker compose down -v
docker compose logs -f app
```

For local development without Docker, copy `.env.example` to `.env.local` and
adjust `MONGODB_URI` if needed.
