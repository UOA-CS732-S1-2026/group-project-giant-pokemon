# Taskflow User Management Baseline

This version is a baseline implementation of the User Management module for the team project.

The project stack:
- Next.js
- TypeScript
- MongoDB Atlas
- Mongoose

## Purpose
This baseline is intended to:

- establishes a full-stack foundation for user authentication and profile management
- align development with the intended final tech stack
- provide a reference structure for future modules

## Current Scope
This version currently includes:

- User model with Mongoose
- MongoDB connection setup
- Authentication APIs (Signup, Login, Logout)
- Session validation API
- Profile update API
- Basic user management UI (Login, Signup, Dashboard, Profile)
- JWT authentication using HTTP‑only cookies

### Implemented APIs

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/profile`

## Project Structure
```bash
app/
  api/
    auth/
      login/
        route.ts
      signup/
        route.ts
      logout/
        route.ts
      me/
        route.ts
    profile/
      route.ts

  dashboard/
    page.tsx

  profile/
    page.tsx

  login/
    page.tsx

  signup/
    page.tsx

components/
  Navbar.tsx

lib/
  mongodb.ts
  jwt.ts

models/
  User.ts

types/
  user.ts