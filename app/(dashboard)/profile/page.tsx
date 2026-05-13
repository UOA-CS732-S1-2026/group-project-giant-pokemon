"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { calculateTaskStats, normalizeDate } from "@/lib/productivityOcean";
import { Badge, Button, FieldLabel, LoadingState, PageHeader, Panel, Select, TextInput } from "@/components/ui/foundation";
import type { Task, TaskAPI } from "@/types/task";

type ProfileUser = {
  name?: string;
  email?: string;
  role?: string;
  profilePhoto?: string;
};

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

function getActiveTaskPercent(active: number) {
  if (active === 0) return 0;
  if (active <= 3) return 20;
  if (active <= 7) return 40;
  if (active <= 10) return 60;
  if (active <= 15) return 80;
  return 100;
}

function getThemeByPercent(percent: number) {
  if (percent === 0)
    return {
      bg: "bg-gradient-to-b from-[#1a2b6d] via-[#0f1a4a] to-[#0a1138]",
      accent: "text-indigo-300",
      label: "Calm Waters",
    };

  if (percent <= 20)
    return {
      bg: "from-[#0d3b66] via-[#0a4a7a] to-[#085a92]",
      accent: "text-blue-300",
      label: "Steady Flow",
    };

  if (percent <= 40)
    return {
      bg: "from-[#0a2e3b] via-[#0b3f4a] to-[#0c5160]",
      accent: "text-teal-300",
      label: "Choppy Waters",
    };

  if (percent === 60)
    return {
      bg: "from-[#4b2e05] via-[#6b3f07] to-[#8a4f09]",
      accent: "text-amber-300",
      label: "Turbulent Waters",
    };

  if (percent <= 80)
    return {
      bg: "from-[#3b1a1a] via-[#4a0f0f] to-[#280a0a]",
      accent: "text-orange-300",
      label: "Rough Seas",
    };

  return {
    bg: "from-[#2b1a1a] via-[#3a0f0f] to-[#1a0707]",
    accent: "text-red-300",
    label: "Stormy Seas",
  };
}

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [tasks, setTasks] = useState<Task[]>([]);

  const [name, setName] = useState("");
  const [role, setRole] = useState("Student");
  const [profilePhoto, setProfilePhoto] = useState("");

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/auth/me");

      if (!res.ok) {
        window.location.href = "/auth";
        return;
      }

      const data = await res.json();
      setUser(data.user);

      setName(data.user.name ?? "");
      setRole(data.user.role ?? "Student");
      setProfilePhoto(data.user.profilePhoto ?? "");

      setLoading(false);
    }

    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchTasks() {
      const res = await fetch("/api/tasks?includeCompleted=true");
      const json = await res.json();

      if (json.success) {
        setTasks(json.data.map(mapTask));
      }
    }

    fetchTasks();
  }, []);

  const taskStats = useMemo(() => calculateTaskStats(tasks), [tasks]);
  const activeTasks = taskStats.activeTasks;

  const activePercent = getActiveTaskPercent(activeTasks);
  const theme = getThemeByPercent(activePercent);

  async function handleSave() {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, profilePhoto }),
    });

    alert("Profile updated!");
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  if (loading || !user) {
    return <LoadingState label="Loading profile..." />;
  }

  const fallbackInitial = (user.name ?? "U").charAt(0).toUpperCase();

  return (
    <>
      <PageHeader
        label="Profile"
        title="Profile Overview"
        description="Your profile and workload signals in one operational view."
        actions={<Badge tone={activePercent >= 80 ? "rose" : activePercent >= 60 ? "amber" : "cyan"}>{theme.label}</Badge>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel className={`col-span-2 bg-gradient-to-b ${theme.bg}`}>
          <h3 className="text-xl font-semibold text-white">Personal Information</h3>

          <div className="mt-6 space-y-5">
            <div>
              <FieldLabel>Full name</FieldLabel>
              <TextInput value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <FieldLabel>Email</FieldLabel>
              <TextInput value={user.email ?? ""} disabled className="text-blue-200 disabled:opacity-80" />
            </div>

            <div>
              <FieldLabel>Role</FieldLabel>
              <Select value={role} onChange={(e) => setRole(e.target.value)}>
                <option>Student</option>
                <option>Developer</option>
                <option>Researcher</option>
                <option>Professional</option>
              </Select>
            </div>
          </div>
        </Panel>

        <Panel className="flex flex-col items-center text-center">
          {profilePhoto ? (
            <Image
              src={profilePhoto}
              alt="Profile"
              width={128}
              height={128}
              className="h-32 w-32 rounded-full border border-white/20 object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-full border border-white/20 bg-white/10 text-5xl font-bold shadow-lg">
              {fallbackInitial}
            </div>
          )}

          <label className="mt-4 cursor-pointer rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-blue-200/50 hover:bg-blue-400/10">
            Upload Photo
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>

          <p className="mt-4 text-sm text-blue-100">{role}</p>
          <div className="my-6 h-px w-full bg-white/10"></div>
          <p className="text-lg font-semibold text-white">Current Workload</p>
          <p className={`${theme.accent} text-xl font-bold`}>{theme.label}</p>
          <p className="mt-4 text-blue-100">
            Workload Level: <span className="font-bold text-white">{activePercent}%</span>
          </p>
          <p className="mt-2 text-blue-100">
            Active Tasks: <span className="font-bold text-white">{activeTasks}</span>
          </p>

          <Button type="button" className="mt-6 w-full" onClick={handleSave}>
            Save Changes
          </Button>
        </Panel>
      </div>
    </>
  );
}
