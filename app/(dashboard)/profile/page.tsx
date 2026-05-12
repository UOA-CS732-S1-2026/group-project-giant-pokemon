"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateTaskStats, normalizeDate } from "@/lib/productivityOcean";
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050b24] text-white">
        Loading...
      </div>
    );
  }

  const fallbackInitial = (user.name ?? "U").charAt(0).toUpperCase();

  return (
    <div
      className={`min-h-screen p-10 text-white bg-gradient-to-b ${theme.bg} transition-all duration-700`}
    >
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Profile Overview
        </h1>
        <p className={`${theme.accent} mt-1 text-lg`}>
          Your theme adapts to your current workload.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* LEFT — Editable Info */}
        <div className="col-span-2 bg-white/10 p-8 rounded-3xl shadow-xl backdrop-blur-md">
          <h3 className="text-xl font-bold mb-6">Personal Information</h3>

          <div className="space-y-6">

            <div>
              <label className="block font-medium mb-1">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/30 text-white border border-white/20 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Email</label>
              <input
                value={user.email ?? ""}
                disabled
                className="w-full bg-black/30 text-blue-300 border border-white/20 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-black/30 text-white border border-white/20 rounded-lg px-4 py-2"
              >
                <option>Student</option>
                <option>Developer</option>
                <option>Researcher</option>
                <option>Professional</option>
              </select>
            </div>

          </div>
        </div>

        {/* RIGHT — Summary + Photo */}
        <div className="bg-white/10 p-8 rounded-3xl shadow-xl backdrop-blur-md text-center flex flex-col items-center">

          {/* Profile Photo or Initial */}
          {profilePhoto ? (
            <img
              src={profilePhoto}
              className="w-32 h-32 rounded-full object-cover shadow-lg border border-white/20"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center text-5xl font-bold shadow-lg border border-white/20">
              {fallbackInitial}
            </div>
          )}

          {/* Upload Button */}
          <label className="mt-4 cursor-pointer bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition">
            Upload Photo
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>

          <p className="text-blue-100 text-sm mt-4">{role}</p>

          <div className="w-full h-px bg-white/20 my-6"></div>

          <p className="text-lg font-semibold">Current Workload</p>
          <p className={`${theme.accent} text-xl font-bold`}>
            {theme.label}
          </p>

          <p className="mt-4 text-blue-100">
            Workload Level:{" "}
            <span className="font-bold text-white">{activePercent}%</span>
          </p>

          <p className="mt-2 text-blue-100">
            Active Tasks:{" "}
            <span className="font-bold text-white">{activeTasks}</span>
          </p>

        </div>
      </div>

      <div className="mt-12 flex justify-center">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white font-semibold px-10 py-3 rounded-xl text-lg shadow-md hover:bg-blue-700 transition"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}