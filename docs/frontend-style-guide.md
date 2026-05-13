# TASKFLOW AI Frontend Style Guide

This guide extracts the shared visual style from the `frontEndLayout` JSX prototype so it can be applied consistently to the Next.js goal management pages.

## Visual Direction

- Overall style: dark glassmorphism productivity dashboard.
- Mood: focused, modern, calm, AI-assisted planning.
- Primary color: blue.
- Background: deep slate/near-black radial gradient.
- Surfaces: translucent white panels with subtle borders, blue-tinted shadows, and blur.
- Shape language: large rounded panels, pill badges, rounded form controls.

## Core Tokens

### App Background

Use this for authenticated app pages:

```tsx
className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,#1d4ed8_0%,#0f172a_35%,#020617_100%)] p-4 text-white sm:p-6"
```

### Main Layout Container

```tsx
className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row"
```

For page content beside the sidebar:

```tsx
className="flex min-w-0 flex-1 flex-col gap-5"
```

### Primary Panel

Use for page headers, forms, dashboard blocks, and major content sections:

```tsx
className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20"
```

For stronger shell panels such as sidebar or auth card:

```tsx
className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur"
```

### Nested Panel

Use inside cards for schedule rows, activity rows, compact details, or embedded progress summaries:

```tsx
className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
```

## Typography

Page section heading:

```tsx
className="text-3xl font-bold text-white"
```

Card heading:

```tsx
className="text-xl font-bold text-white"
```

Supporting text:

```tsx
className="mt-2 text-slate-300"
```

Small supporting text:

```tsx
className="mt-1 text-sm text-slate-300"
```

Field label:

```tsx
className="mb-2 block text-sm font-medium text-slate-200"
```

## Controls

### Text Input, Select, Date, Time, Number

```tsx
className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
```

### Primary Button

```tsx
className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950"
```

### Secondary Button

```tsx
className="rounded-2xl border border-blue-300/30 px-5 py-3 text-sm font-semibold text-blue-100 transition hover:border-blue-200 hover:bg-blue-500/20"
```

### Compact Action Buttons

Edit:

```tsx
className="rounded-xl border border-blue-300/30 px-3 py-2 text-sm font-semibold text-blue-100 transition hover:border-blue-200 hover:bg-blue-500/20"
```

Delete:

```tsx
className="rounded-xl border border-red-300/30 px-3 py-2 text-sm font-semibold text-red-100 transition hover:border-red-200 hover:bg-red-500/20"
```

Complete/success:

```tsx
className="rounded-xl border border-emerald-300/30 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-500/20"
```

## Badges

Primary badge:

```tsx
className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-100"
```

Neutral badge:

```tsx
className="rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-slate-200"
```

Success badge:

```tsx
className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100"
```

Danger badge:

```tsx
className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-100"
```

## Feedback Messages

Error:

```tsx
className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
```

Success:

```tsx
className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-100"
```

Info:

```tsx
className="rounded-2xl border border-blue-300/20 bg-blue-500/10 p-4 text-sm font-medium text-blue-100"
```

## Progress Bar

Track:

```tsx
className="h-3 w-full overflow-hidden rounded-full bg-slate-900/80"
```

Fill:

```tsx
className="h-full rounded-full bg-blue-500 shadow-lg shadow-blue-500/40 transition-all"
```

## Goal Management Mapping

When restyling the existing Next.js goal management UI:

- Wrap the page in the app background.
- Add the shared navigation shell if the page is authenticated.
- Convert the current plain `main` into a `space-y-5` content area.
- Use one primary panel for the page intro.
- Use one primary panel for the goal form.
- Render goals in a responsive grid: `grid gap-4 xl:grid-cols-2`.
- Convert each goal list item into a primary panel card.
- Replace the current plain status label with pill badges.
- Replace `Progress: 40%` text-only display with the shared progress bar.
- Use blue for primary/create/save actions, blue-outline for edit/cancel, red-outline for delete.

Suggested page structure:

```tsx
<main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,#1d4ed8_0%,#0f172a_35%,#020617_100%)] p-4 text-white sm:p-6">
  <div className="mx-auto max-w-7xl space-y-5">
    <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
      <h1 className="text-3xl font-bold text-white">Your Goals</h1>
      <p className="mt-2 text-slate-300">Break long-term ambitions into manageable steps.</p>
    </section>

    {/* Goal form panel */}
    {/* Goal card grid */}
  </div>
</main>
```

## Source Files Used

- `src/components/layout/AppLayout.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/Topbar.jsx`
- `src/pages/Auth.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/Goals.jsx`
- `src/pages/Tasks.jsx`
- `src/pages/Schedule.jsx`
- `src/pages/Progress.jsx`
- `src/components/ui/GoalCard.jsx`
- `src/components/ui/TaskCard.jsx`
- `src/components/ui/ProgressBar.jsx`
- `src/components/ui/StatCard.jsx`
