"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Leaf,
  Loader2,
  RefreshCw,
  Trophy,
  Waves,
  X,
} from "lucide-react";
import type { Goal, GoalAPI } from "@/types/goal";
import type { Task, TaskAPI, TaskPriority } from "@/types/task";
import {
  type Achievement,
  type OceanItem,
  calculateAchievements,
  calculateGoalStats,
  calculateLevel,
  calculateTaskStats,
  calculateTotalXP,
  flattenOceanItems,
  getOceanStatus,
  getOceanStatusLabel,
  getOceanStatusMessage,
  normalizeDate,
} from "@/lib/productivityOcean";

type ApiState = "idle" | "loading" | "ready" | "error";
type OceanVisual = { type: "emoji"; value: string } | { type: "image"; value: string };

const SEA_LIFE_EMOJIS = ["🐠", "🐬", "🦈", "🐚", "🐙", "🦐", "🪼", "🐡", "🐳"];
const RUBBISH_EMOJIS = ["🚬", "🦠", "💡", "🧱", "🧽", "🧴", "☎️"];
const SEA_LIFE_IMAGES = [
  "/ocean/sea%20life/dolphin.png",
  "/ocean/sea%20life/fish.png",
  "/ocean/sea%20life/plant.png",
  "/ocean/sea%20life/seahorse.png",
  "/ocean/sea%20life/seashell.png",
  "/ocean/sea%20life/starfish.png",
];

const RUBBISH_IMAGES = [
  "/ocean/rubbish/bottle.png",
  "/ocean/rubbish/cap.png",
  "/ocean/rubbish/cigarette.png",
  "/ocean/rubbish/soda%20can.png",
  "/ocean/rubbish/straw.png",
  "/ocean/rubbish/trashbag.png",
];

const SEA_LIFE_EMOJI_VISUALS: OceanVisual[] = SEA_LIFE_EMOJIS.map((value) => ({ type: "emoji", value }));
const RUBBISH_EMOJI_VISUALS: OceanVisual[] = RUBBISH_EMOJIS.map((value) => ({ type: "emoji", value }));
const SEA_LIFE_IMAGE_VISUALS: OceanVisual[] = SEA_LIFE_IMAGES.map((value) => ({ type: "image", value }));
const RUBBISH_IMAGE_VISUALS: OceanVisual[] = RUBBISH_IMAGES.map((value) => ({ type: "image", value }));

function mapTask(task: TaskAPI): Task {
  return {
    id: task._id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    estimatedMinutes: task.estimatedMinutes,
    deadline: normalizeDate(task.deadline),
    userId: task.userId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function getStableImageIndex(seed: string, imageCount: number): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash % imageCount;
}

function getOceanVisual(item: OceanItem, levelNumber: number): OceanVisual {
  const baseVisuals = item.completed ? SEA_LIFE_EMOJI_VISUALS : RUBBISH_EMOJI_VISUALS;
  const imageVisuals = item.completed ? SEA_LIFE_IMAGE_VISUALS : RUBBISH_IMAGE_VISUALS;
  const visuals = levelNumber > 1 ? [...baseVisuals, ...imageVisuals] : baseVisuals;

  return visuals[getStableImageIndex(item.id, visuals.length)];
}

function getStableOffset(seed: string): { x: number; y: number } {
  const x = getStableImageIndex(`${seed}-x`, 33) - 16;
  const y = getStableImageIndex(`${seed}-y`, 29) - 14;

  return { x, y };
}

function mapGoal(goal: GoalAPI): Goal {
  return {
    id: goal._id,
    title: goal.title,
    description: goal.description,
    status: goal.status,
    targetDate: normalizeDate(goal.targetDate),
    progress: goal.progress,
    tags: goal.tags,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
}

export default function ProductivityOceanClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [status, setStatus] = useState<ApiState>("idle");
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState<OceanItem | null>(null);

  async function fetchOceanData() {
    setStatus("loading");
    setError("");

    try {
      const [tasksRes, goalsRes] = await Promise.all([
        fetch("/api/tasks?includeCompleted=true"),
        fetch("/api/goals"),
      ]);
      const [tasksJson, goalsJson] = await Promise.all([tasksRes.json(), goalsRes.json()]);

      if (!tasksRes.ok || !tasksJson.success) {
        throw new Error(tasksJson.error || "Failed to load tasks.");
      }

      if (!goalsRes.ok || !goalsJson.success) {
        throw new Error(goalsJson.error || "Failed to load goals.");
      }

      setTasks((tasksJson.data as TaskAPI[]).map(mapTask));
      setGoals((goalsJson.data as GoalAPI[]).map(mapGoal));
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  useEffect(() => {
    fetchOceanData();
  }, []);

  const taskStats = useMemo(() => calculateTaskStats(tasks), [tasks]);
  const goalStats = useMemo(() => calculateGoalStats(goals), [goals]);
  const totalXP = useMemo(() => calculateTotalXP(tasks), [tasks]);
  const levelInfo = useMemo(() => calculateLevel(totalXP), [totalXP]);
  const oceanItems = useMemo(() => flattenOceanItems(tasks), [tasks]);
  const achievements = useMemo(
    () =>
      calculateAchievements({
        tasks,
        goals,
        totalXP,
        levelInfo,
        oceanHealth: taskStats.oceanHealth,
      }),
    [goals, levelInfo, taskStats.oceanHealth, tasks, totalXP],
  );

  if (status === "loading" || status === "idle") {
    return (
      <OceanShell>
        <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-white/10 bg-slate-950/50">
          <div className="flex flex-col items-center gap-3 text-slate-200">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-200" />
            <p className="text-sm font-medium">Loading productivity ocean...</p>
          </div>
        </div>
      </OceanShell>
    );
  }

  if (status === "error") {
    return (
      <OceanShell>
        <section className="rounded-lg border border-rose-300/30 bg-rose-500/10 p-6 text-rose-100">
          <h2 className="text-lg font-semibold">Could not load Productivity Ocean</h2>
          <p className="mt-2 text-sm text-rose-100/80">{error}</p>
          <button
            type="button"
            onClick={fetchOceanData}
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-950 transition hover:bg-white"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </section>
      </OceanShell>
    );
  }

  return (
    <OceanShell>
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-white/10 bg-slate-950/65 p-6 shadow-xl shadow-cyan-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-200">Productivity Ocean</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Turn completed tasks into a cleaner ocean</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                This view uses your real backend tasks and goals. Completed work restores ocean life; unfinished and
                overdue work shows what still needs attention.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchOceanData}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-cyan-200/30 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-100 hover:bg-cyan-400/10"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Ocean Health" value={`${taskStats.oceanHealth}%`} tone="cyan" />
            <StatCard label="Completed" value={`${taskStats.completedTasks} / ${taskStats.totalTasks}`} tone="emerald" />
            <StatCard label="Current XP" value={`${totalXP} XP`} tone="amber" />
            <StatCard label="Active Goals" value={goalStats.activeGoals} tone="violet" />
          </div>
        </div>

        <LevelCard totalXP={totalXP} levelInfo={levelInfo} />
      </section>

      <OceanScene
        items={oceanItems}
        health={taskStats.oceanHealth}
        levelNumber={levelInfo.currentLevelNumber}
        totalTasks={taskStats.totalTasks}
        onSelect={setSelectedItem}
      />

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <HealthCard
            health={taskStats.oceanHealth}
            totalTasks={taskStats.totalTasks}
            activeTasks={taskStats.activeTasks}
            overdueTasks={taskStats.overdueTasks}
          />
          <div className="rounded-lg border border-white/10 bg-slate-950/60 p-5">
            <h2 className="text-lg font-bold text-white">Backend Snapshot</h2>
            <div className="mt-4 grid gap-3">
              <MiniStat label="In progress" value={taskStats.inProgressTasks} />
              <MiniStat label="Average goal progress" value={`${goalStats.averageProgress}%`} />
              <MiniStat label="Completed goals" value={goalStats.completedGoals} />
            </div>
          </div>
        </div>

        <AchievementsPanel achievements={achievements} />
      </section>

      {selectedItem && (
        <OceanItemModal
          item={selectedItem}
          levelNumber={levelInfo.currentLevelNumber}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </OceanShell>
  );
}

function OceanShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5 text-white">{children}</div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "cyan" | "emerald" | "amber" | "violet";
}) {
  const tones = {
    cyan: "text-cyan-100 bg-cyan-400/10 border-cyan-200/20",
    emerald: "text-emerald-100 bg-emerald-400/10 border-emerald-200/20",
    amber: "text-amber-100 bg-amber-400/10 border-amber-200/20",
    violet: "text-violet-100 bg-violet-400/10 border-violet-200/20",
  };

  return (
    <article className={`rounded-md border p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-3 text-2xl font-bold leading-tight">{value}</p>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-4 py-3">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function LevelCard({ totalXP, levelInfo }: { totalXP: number; levelInfo: ReturnType<typeof calculateLevel> }) {
  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/65 p-6 shadow-xl shadow-cyan-950/20">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-amber-300/15 text-amber-100">
          <Trophy className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-100">{levelInfo.currentLevelLabel}</p>
          <h2 className="mt-1 text-xl font-bold text-white">{totalXP} XP collected</h2>
          <p className="mt-2 text-sm text-slate-300">
            {levelInfo.isMaxLevel
              ? "Highest level reached."
              : `${levelInfo.xpNeededForNextLevel} XP until the next level.`}
          </p>
        </div>
      </div>
      <ProgressBar value={levelInfo.levelProgressPercent} className="mt-6" />
    </section>
  );
}

function HealthCard({
  health,
  totalTasks,
  activeTasks,
  overdueTasks,
}: {
  health: number;
  totalTasks: number;
  activeTasks: number;
  overdueTasks: number;
}) {
  const status = getOceanStatus(health, totalTasks);

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Ocean Health</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{getOceanStatusMessage(status)}</p>
        </div>
        <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
          {getOceanStatusLabel(status)}
        </span>
      </div>
      <ProgressBar value={health} className="mt-5" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MiniStat label="Active tasks" value={activeTasks} />
        <MiniStat label="Overdue active tasks" value={overdueTasks} />
      </div>
    </section>
  );
}

function OceanScene({
  items,
  health,
  levelNumber,
  totalTasks,
  onSelect,
}: {
  items: OceanItem[];
  health: number;
  levelNumber: number;
  totalTasks: number;
  onSelect: (item: OceanItem) => void;
}) {
  const status = getOceanStatus(health, totalTasks);
  const sceneTone = {
    empty: "from-slate-800 via-blue-950 to-slate-950",
    polluted: "from-slate-700 via-blue-950 to-zinc-950",
    recovering: "from-cyan-950 via-blue-900 to-emerald-950",
    healthy: "from-cyan-800 via-blue-800 to-emerald-800",
    thriving: "from-cyan-600 via-blue-700 to-emerald-600",
  }[status];

  return (
    <section className={`overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b ${sceneTone} p-5 shadow-2xl shadow-cyan-950/25`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Ocean Scene</h2>
          <p className="mt-1 text-sm text-cyan-100">{getOceanStatusMessage(status)}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-50">
          <Waves className="h-4 w-4" />
          {getOceanStatusLabel(status)}
        </span>
      </div>

      <div className="relative mt-5 min-h-[360px] overflow-hidden rounded-lg border border-white/10 bg-blue-950/35">
        <div className="pointer-events-none absolute inset-x-[-15%] top-4 h-20">
          <div className="animate-wave-move h-14 rounded-[50%] bg-white/10 blur-sm" />
        </div>

        {items.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-slate-200">
            <div>
              <Leaf className="mx-auto h-10 w-10 text-emerald-100" />
              <p className="mt-3 text-sm">No tasks yet. Create tasks to begin restoring your ocean.</p>
              <Link href="/tasks" className="mt-5 inline-flex rounded-md bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-950">
                Add tasks
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative z-10 grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((item, index) => (
              <OceanItemButton
                key={item.id}
                item={item}
                index={index}
                levelNumber={levelNumber}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function OceanItemButton({
  item,
  index,
  levelNumber,
  onSelect,
}: {
  item: OceanItem;
  index: number;
  levelNumber: number;
  onSelect: (item: OceanItem) => void;
}) {
  const visual = getOceanVisual(item, levelNumber);
  const offset = getStableOffset(item.id);

  return (
    <div
      className="flex h-28 w-full items-center justify-center"
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <button
        type="button"
        onClick={() => onSelect(item)}
        style={{ animationDelay: `${index * 70}ms` }}
        className="animate-float-slow flex h-24 w-24 items-center justify-center bg-transparent p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-200"
        aria-label={`Open ${item.title}`}
      >
        {visual.type === "image" ? (
          <Image
            src={visual.value}
            alt={item.title}
            width={112}
            height={112}
            className="h-24 w-24 object-contain drop-shadow-[0_14px_18px_rgba(2,6,23,0.45)]"
          />
        ) : (
          <span
            aria-hidden="true"
            className="text-6xl leading-none drop-shadow-[0_14px_18px_rgba(2,6,23,0.45)]"
          >
            {visual.value}
          </span>
        )}
      </button>
    </div>
  );
}

function AchievementsPanel({ achievements }: { achievements: Achievement[] }) {
  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/60 p-5">
      <div className="flex items-center gap-3">
        <Award className="h-5 w-5 text-amber-100" />
        <h2 className="text-lg font-bold text-white">Achievements</h2>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.name} achievement={achievement} />
        ))}
      </div>
    </section>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const accent = {
    blue: "border-blue-200/20 bg-blue-300/10 text-blue-100",
    emerald: "border-emerald-200/20 bg-emerald-300/10 text-emerald-100",
    amber: "border-amber-200/20 bg-amber-300/10 text-amber-100",
    rose: "border-rose-200/20 bg-rose-300/10 text-rose-100",
  }[achievement.accent];

  return (
    <article className={`rounded-md border p-4 ${achievement.unlocked ? accent : "border-white/10 bg-white/5 text-slate-400"}`}>
      <div className="flex items-start gap-3">
        <CheckCircle2 className={`mt-0.5 h-5 w-5 ${achievement.unlocked ? "" : "opacity-40"}`} />
        <div>
          <h3 className="font-semibold text-white">{achievement.name}</h3>
          <p className="mt-1 text-sm leading-5 opacity-80">{achievement.description}</p>
        </div>
      </div>
    </article>
  );
}

function OceanItemModal({
  item,
  levelNumber,
  onClose,
}: {
  item: OceanItem;
  levelNumber: number;
  onClose: () => void;
}) {
  const visual = getOceanVisual(item, levelNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm" onClick={onClose}>
      <section
        className="w-full max-w-lg rounded-lg border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-cyan-950/40"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {visual.type === "image" ? (
              <Image
                src={visual.value}
                alt=""
                width={72}
                height={72}
                className="mb-4 h-16 w-16 object-contain drop-shadow-[0_12px_18px_rgba(2,6,23,0.55)]"
              />
            ) : (
              <span
                aria-hidden="true"
                className="mb-4 block text-6xl leading-none drop-shadow-[0_12px_18px_rgba(2,6,23,0.55)]"
              >
                {visual.value}
              </span>
            )}
            <h2 className="text-2xl font-bold text-white">{item.title}</h2>
            <p className="mt-2 text-sm capitalize text-cyan-100">{item.statusLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Detail label="Priority" value={formatPriority(item.priority)} />
          <Detail label="Deadline" value={item.deadline || "Not set"} />
          <Detail label="XP value" value={`${item.xpValue} XP`} />
          <Detail label="Ocean effect" value={item.completed ? "Restoring ocean life" : "Needs attention"} />
        </div>
        <Detail label="Description" value={item.description || "No description added."} className="mt-3" />
      </section>
    </div>
  );
}

function Detail({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-md border border-white/10 bg-white/5 p-4 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-100">{value}</p>
    </div>
  );
}

function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`h-3 w-full overflow-hidden rounded-full bg-slate-900/80 ${className}`}>
      <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-200 transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function formatPriority(priority: TaskPriority): string {
  return priority[0].toUpperCase() + priority.slice(1);
}
