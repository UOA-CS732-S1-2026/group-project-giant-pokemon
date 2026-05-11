export function calculateTaskProgress(task) {
  const subtasks = task.subtasks || []
  const hasSubtasks = subtasks.length > 0
  const completedSubtasks = subtasks.filter((subtask) => subtask.completed).length
  const isFullyCompleted =
    task.status === 'Completed' ||
    (hasSubtasks && completedSubtasks === subtasks.length)

  if (isFullyCompleted) {
    return 1
  }

  if (!hasSubtasks) {
    return 0
  }

  return completedSubtasks / subtasks.length
}

export function calculateOceanHealth(tasks) {
  if (tasks.length === 0) {
    return 100
  }

  const progressTotal = tasks.reduce(
    (total, task) => total + calculateTaskProgress(task),
    0,
  )

  return Math.round((progressTotal / tasks.length) * 100)
}

export function calculateOceanStats(tasks) {
  const totalTasks = tasks.length
  const totalSubtasks = tasks.reduce(
    (total, task) => total + (task.subtasks || []).length,
    0,
  )
  const completedTasks = tasks.filter(
    (task) => calculateTaskProgress(task) === 1,
  ).length
  const completedSubtasks = tasks.reduce(
    (total, task) =>
      total + (task.subtasks || []).filter((subtask) => subtask.completed).length,
    0,
  )

  return {
    totalTasks,
    totalSubtasks,
    completedTasks,
    completedSubtasks,
    remainingTasks: totalTasks - completedTasks,
    remainingSubtasks: totalSubtasks - completedSubtasks,
    oceanHealth: calculateOceanHealth(tasks),
  }
}

export function getBaseXP(priority) {
  const xpByPriority = {
    Low: 10,
    Medium: 20,
    High: 30,
  }

  return xpByPriority[priority] || xpByPriority.Medium
}

export function calculateTaskXP(task, completionDate = null) {
  const baseXP = getBaseXP(task.priority)
  const dueDate = new Date(`${task.dueDate}T23:59:59`)

  if (!task.dueDate) {
    return baseXP
  }

  if (!completionDate && task.status !== 'Completed' && new Date() > dueDate) {
    return -Math.round(baseXP * 0.3)
  }

  const completedAt = new Date(completionDate || new Date())

  if (completedAt < new Date(`${task.dueDate}T00:00:00`)) {
    return Math.round(baseXP * 1.25)
  }

  if (completedAt <= dueDate) {
    return Math.round(baseXP)
  }

  return Math.round(baseXP * 0.5)
}

export function calculateSubtaskXP(task) {
  const subtaskCount = (task.subtasks || []).length

  if (subtaskCount === 0) {
    return 0
  }

  return Math.round((getBaseXP(task.priority) * 0.25) / subtaskCount)
}

export function calculateLevel(totalXP) {
  const levels = [
    { level: 1, title: 'Starter', minXP: 0, nextLevelXP: 100 },
    { level: 2, title: 'Organizer', minXP: 100, nextLevelXP: 200 },
    { level: 3, title: 'Planner', minXP: 200, nextLevelXP: 300 },
    { level: 4, title: 'Achiever', minXP: 300, nextLevelXP: 500 },
    { level: 5, title: 'Master Scheduler', minXP: 500, nextLevelXP: 500 },
  ]
  const currentLevel =
    [...levels].reverse().find((level) => totalXP >= level.minXP) || levels[0]

  return {
    ...currentLevel,
    label: `Level ${currentLevel.level} ${currentLevel.title}`,
    xpIntoLevel: totalXP - currentLevel.minXP,
    xpForNextLevel: Math.max(currentLevel.nextLevelXP - totalXP, 0),
  }
}
