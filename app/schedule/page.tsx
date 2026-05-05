"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: "low" | "medium" | "high";
  estimatedMinutes: number;
  deadline?: string;
}

interface TaskAPI {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: "low" | "medium" | "high";
  estimatedMinutes: number;
  deadline?: string;
}

interface ScheduledTask {
  id: string;
  taskId: string;
  title: string;
  startTime: string;
  endTime: string;
  completed: boolean;
}

export default function SchedulePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("09:00");
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  const timeSlots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, "0")}:00`);
    timeSlots.push(`${hour.toString().padStart(2, "0")}:30`);
  }

  // ✅ 修复：fetch 时映射 _id -> id
  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch("/api/tasks");
        const result = await res.json();
        if (result.success) {
          const mapped: Task[] = result.data.map((t: TaskAPI) => ({
            id: t._id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            estimatedMinutes: t.estimatedMinutes,
            deadline: t.deadline,
          }));
          setTasks(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      }
    }
    fetchTasks();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("scheduledTasks");
    if (saved) {
      setScheduledTasks(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("scheduledTasks", JSON.stringify(scheduledTasks));
  }, [scheduledTasks]);

  const getEndTime = (start: string, durationHours: number): string => {
    const [hour, minute] = start.split(":").map(Number);
    const totalMinutes = hour * 60 + minute + durationHours * 60;
    const newHour = Math.floor(totalMinutes / 60) % 24;
    const newMinute = totalMinutes % 60;
    return `${newHour.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`;
  };

  const getTaskAtTime = (time: string): ScheduledTask | undefined => {
    return scheduledTasks.find(task =>
      time >= task.startTime && time < task.endTime
    );
  };

  const hasTimeConflict = (startTime: string, endTime: string, excludeId?: string): boolean => {
    return scheduledTasks.some(t => {
      if (excludeId && t.id === excludeId) return false;
      return (startTime >= t.startTime && startTime < t.endTime) ||
             (endTime > t.startTime && endTime <= t.endTime) ||
             (startTime <= t.startTime && endTime >= t.endTime);
    });
  };

  const addTaskToSchedule = () => {
    if (!selectedTaskId) {
      alert("Please select a task first.");
      return;
    }

    const task = tasks.find(t => t.id === selectedTaskId);
    if (!task) return;

    const endTime = getEndTime(selectedStartTime, selectedDuration);

    if (hasTimeConflict(selectedStartTime, endTime)) {
      alert("Time slot conflict! Choose another time.");
      return;
    }

    const newScheduled: ScheduledTask = {
      id: Date.now().toString(),
      taskId: task.id,
      title: task.title,
      startTime: selectedStartTime,
      endTime,
      completed: false,
    };

    setScheduledTasks(prev => [...prev, newScheduled]);
    setSelectedTaskId("");
    setShowTaskSelector(false);
  };

  const removeTask = (id: string) => {
    setScheduledTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleComplete = (id: string) => {
    setScheduledTasks(prev =>
      prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  };

  // ✅ 修复：dragStart 存的是 task.id（已经是映射后的 _id 值）
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDrop = (e: React.DragEvent, time: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    setDragOverSlot(null);

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // 用 estimatedMinutes 换算成小时
    const durationHours = (task.estimatedMinutes || 60) / 60;
    const endTime = getEndTime(time, durationHours);

    if (hasTimeConflict(time, endTime)) {
      alert("Time slot conflict! Choose another time.");
      return;
    }

    const newScheduled: ScheduledTask = {
      id: Date.now().toString(),
      taskId: task.id,
      title: task.title,
      startTime: time,
      endTime,
      completed: false,
    };

    setScheduledTasks(prev => [...prev, newScheduled]);
  };

  const handleDragOver = (e: React.DragEvent, time: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverSlot(time);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const getTaskColor = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return "bg-gray-50 border-l-4 border-gray-400";
    if (task.priority === "high") return "bg-red-50 border-l-4 border-red-500";
    if (task.priority === "medium") return "bg-yellow-50 border-l-4 border-yellow-500";
    return "bg-green-50 border-l-4 border-green-500";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📅 Smart Schedule</h1>
          <button
            onClick={() => setShowTaskSelector(!showTaskSelector)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Add Task
          </button>
        </div>

        {/* 任务选择器 */}
        {showTaskSelector && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Schedule a Task</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a task...</option>
                {tasks.filter(t => t.status !== "completed").map(task => (
                  <option key={task.id} value={task.id}>
                    {task.title} ({task.priority}) — {task.estimatedMinutes}min
                  </option>
                ))}
              </select>

              <input
                type="time"
                value={selectedStartTime}
                onChange={(e) => setSelectedStartTime(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0.5}>30 minutes</option>
                <option value={1}>1 hour</option>
                <option value={1.5}>1.5 hours</option>
                <option value={2}>2 hours</option>
                <option value={3}>3 hours</option>
              </select>

              <button
                onClick={addTaskToSchedule}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Add to Schedule
              </button>
            </div>
          </div>
        )}

        {/* 可拖拽任务列表 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">📋 Available Tasks (Drag to timeline)</h2>
          <div className="flex flex-wrap gap-2">
            {tasks.filter(t => t.status !== "completed").map(task => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                className={`px-3 py-2 rounded-lg cursor-move hover:shadow-md transition shadow-sm select-none ${getTaskColor(task.id)}`}
              >
                <span className="font-medium">{task.title}</span>
                <span className="text-xs text-gray-500 ml-2">{task.estimatedMinutes}min</span>
              </div>
            ))}
            {tasks.filter(t => t.status !== "completed").length === 0 && (
              <p className="text-gray-500 text-sm">No pending tasks. Go create some tasks first!</p>
            )}
          </div>
        </div>

        {/* 时间线 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-8 border-b bg-gray-50 sticky top-0 z-10">
            <div className="p-3 font-semibold text-gray-600 border-r">Time</div>
            <div className="col-span-7 p-3 font-semibold text-gray-600">Schedule</div>
          </div>

          <div className="divide-y">
            {timeSlots.map((time) => {
              const taskAtSlot = getTaskAtTime(time);
              const isHalfHour = time.endsWith(":30");
              const isDragOver = dragOverSlot === time;

              return (
                <div
                  key={time}
                  className={`grid grid-cols-8 transition ${isDragOver ? "bg-blue-50" : "hover:bg-gray-50"}`}
                  onDragOver={(e) => handleDragOver(e, time)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, time)}
                >
                  <div className={`p-3 border-r font-mono text-sm ${isHalfHour ? "text-gray-400" : "text-gray-700 font-medium"}`}>
                    {time}
                  </div>

                  <div className="col-span-7 p-2 min-h-[52px]">
                    {taskAtSlot ? (
                      <div className={`p-2 rounded-lg flex justify-between items-center ${getTaskColor(taskAtSlot.taskId)}`}>
                        <div className="flex-1">
                          <div className={`font-medium ${taskAtSlot.completed ? "line-through text-gray-400" : ""}`}>
                            {taskAtSlot.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {taskAtSlot.startTime} - {taskAtSlot.endTime}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleComplete(taskAtSlot.id)}
                            className={`px-2 py-1 text-sm rounded ${taskAtSlot.completed ? "bg-gray-300 text-gray-600" : "bg-green-500 text-white hover:bg-green-600"}`}
                          >
                            {taskAtSlot.completed ? "Undo" : "Done"}
                          </button>
                          <button
                            onClick={() => removeTask(taskAtSlot.id)}
                            className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : isDragOver ? (
                      <div className="h-full w-full border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center text-blue-500 text-sm min-h-[44px]">
                        Drop here
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 已安排任务列表 */}
        {scheduledTasks.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-3">✅ Scheduled Tasks</h2>
            <div className="space-y-2">
              {[...scheduledTasks].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(task => (
                <div key={task.id} className={`p-3 rounded-lg flex justify-between items-center ${getTaskColor(task.taskId)}`}>
                  <div>
                    <span className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}>
                      {task.title}
                    </span>
                    <span className="text-sm text-gray-500 ml-3">
                      {task.startTime} - {task.endTime}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleComplete(task.id)}
                      className={`px-3 py-1 rounded text-sm ${task.completed ? "bg-gray-300 text-gray-600" : "bg-green-500 text-white hover:bg-green-600"}`}
                    >
                      {task.completed ? "Undo" : "Complete"}
                    </button>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="px-3 py-1 rounded text-sm bg-red-500 text-white hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}