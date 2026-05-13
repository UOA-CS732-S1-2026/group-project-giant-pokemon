import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gauge,
  Goal,
  LayoutDashboard,
  ListChecks,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Waves,
} from "lucide-react";
import type { ComponentType } from "react";

const navigationItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Goals", icon: Goal },
  { label: "Tasks", icon: ListChecks },
  { label: "Schedule", icon: CalendarDays },
  { label: "Ocean", icon: Waves },
];

const stats = [
  { label: "Focus score", value: "86%", detail: "+12% this week", tone: "cyan" },
  { label: "Active tasks", value: "18", detail: "6 high priority", tone: "blue" },
  { label: "Goal progress", value: "64%", detail: "3 milestones near", tone: "emerald" },
  { label: "Planned time", value: "5.5h", detail: "2h deep work", tone: "violet" },
];

const taskRows = [
  { task: "Review project milestones", goal: "COMPSCI 732", status: "In progress", priority: "High", time: "09:00" },
  { task: "Prepare schedule engine tests", goal: "AI planner", status: "Queued", priority: "Medium", time: "11:30" },
  { task: "Update goal progress", goal: "Portfolio", status: "Done", priority: "Low", time: "14:00" },
];

const badgeStyles = {
  High: "border-rose-300/30 bg-rose-400/10 text-rose-100",
  Medium: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  Low: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  "In progress": "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  Queued: "border-blue-300/30 bg-blue-300/10 text-blue-100",
  Done: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
};

export default function UIFoundationPage() {
  return (
    <main className="min-h-screen bg-[#061225] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(34,211,238,0.22),transparent_30%),radial-gradient(circle_at_72%_0%,rgba(37,99,235,0.28),transparent_34%),linear-gradient(135deg,#071326_0%,#092050_45%,#041025_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,transparent_47%,rgba(96,165,250,0.18)_48%,transparent_49%,transparent_100%)]" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-6 px-5 py-5 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500 shadow-lg shadow-blue-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Taskflow</p>
              <p className="text-xs text-blue-200">AI scheduling console</p>
            </div>
          </div>

          <nav className="mt-8 grid gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  className={`flex items-center gap-3 rounded-md border px-3 py-3 text-left text-sm font-medium transition ${
                    item.active
                      ? "border-blue-300/30 bg-blue-500/20 text-white shadow-lg shadow-blue-950/20"
                      : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 rounded-md border border-cyan-300/20 bg-cyan-300/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Today</p>
            <p className="mt-2 text-2xl font-semibold">5 tasks</p>
            <p className="mt-1 text-sm leading-5 text-cyan-50/75">Next focus block starts at 11:30.</p>
          </div>
        </aside>

        <section className="space-y-6">
          <header className="rounded-lg border border-white/10 bg-slate-950/45 px-5 py-4 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-sm border border-blue-300/20 bg-blue-400/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
                  <Gauge className="h-3.5 w-3.5" />
                  Foundation
                </div>
                <h1 className="mt-3 max-w-2xl text-2xl font-semibold leading-snug tracking-normal text-white md:text-3xl">
                  Goal driven planning with a calm operational cockpit.
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Dark navy surfaces, glass panels, bright blue actions, and compact data modules for repeat daily use.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-300/30 bg-blue-500/20 px-4 py-3 text-sm font-semibold text-blue-50 shadow-lg shadow-blue-950/20 transition hover:border-blue-200/60 hover:bg-blue-500/30"
                >
                  <Plus className="h-4 w-4" />
                  Add task
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-blue-200/50 hover:bg-blue-400/10"
                >
                  Generate plan
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-lg border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Schedule command</h2>
                  <p className="mt-1 text-sm text-slate-400">Dense cards, clear hierarchy, no decorative clutter.</p>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-300">
                  <Search className="h-4 w-4" />
                  Search tasks
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-md border border-white/10">
                <div className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr_0.45fr] bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <span>Task</span>
                  <span>Goal</span>
                  <span>Status</span>
                  <span>Priority</span>
                  <span>Time</span>
                </div>
                {taskRows.map((row) => (
                  <div
                    key={row.task}
                    className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr_0.45fr] items-center border-t border-white/10 px-4 py-4 text-sm"
                  >
                    <span className="font-medium text-white">{row.task}</span>
                    <span className="text-slate-300">{row.goal}</span>
                    <span>
                      <Badge label={row.status} />
                    </span>
                    <span>
                      <Badge label={row.priority} />
                    </span>
                    <span className="text-blue-100">{row.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Planning panel</h2>
                  <Settings2 className="h-5 w-5 text-blue-200" />
                </div>

                <div className="mt-5 grid gap-4">
                  <Field label="Focus window" value="09:00 - 17:00" />
                  <Field label="Daily mode" value="Balanced workload" />
                  <Field label="Priority rule" value="Deadline then impact" />
                </div>

                <div className="mt-5 rounded-md border border-emerald-300/20 bg-emerald-300/10 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-100" />
                    <div>
                      <p className="font-semibold text-emerald-50">Ready to schedule</p>
                      <p className="mt-1 text-sm leading-5 text-emerald-50/70">Inputs are compact, legible, and built for quick adjustment.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
                <h2 className="text-xl font-semibold">Component rhythm</h2>
                <div className="mt-5 grid gap-3">
                  <RhythmItem icon={Clock3} label="8px radius on cards and controls" />
                  <RhythmItem icon={ListChecks} label="Small uppercase labels for metadata" />
                  <RhythmItem icon={Sparkles} label="Blue primary actions with white contrast" />
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  const tones: Record<string, string> = {
    cyan: "from-cyan-300/20 to-cyan-300/5 text-cyan-100",
    blue: "from-blue-400/25 to-blue-400/5 text-blue-100",
    emerald: "from-emerald-300/20 to-emerald-300/5 text-emerald-100",
    violet: "from-violet-300/20 to-violet-300/5 text-violet-100",
  };

  return (
    <article className={`rounded-lg border border-white/10 bg-gradient-to-br ${tones[tone]} p-5 shadow-xl shadow-blue-950/20`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm opacity-75">{detail}</p>
    </article>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-sm border px-2 py-1 text-xs font-semibold ${badgeStyles[label as keyof typeof badgeStyles]}`}>
      {label}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</span>
      <span className="block rounded-md border border-white/10 bg-slate-900/70 px-3 py-3 text-sm text-slate-100">{value}</span>
    </label>
  );
}

function RhythmItem({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-slate-200">
      <Icon className="h-4 w-4 text-blue-200" />
      {label}
    </div>
  );
}
