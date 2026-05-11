export function getInitials(fullName) {
  const nameParts = fullName.trim().split(' ').filter(Boolean)

  if (nameParts.length === 0) {
    return 'U'
  }

  return nameParts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function getBaseXP(priority) {
  const xpByPriority = {
    Low: 10,
    Medium: 20,
    High: 30,
  }

  return xpByPriority[priority] || 15
}

export function getDeadlineMultiplier(task) {
  if (!task.dueDate) {
    return 1
  }

  const completedDate = task.completedAt ? new Date(task.completedAt) : new Date()
  const dueStart = new Date(`${task.dueDate}T00:00:00`)
  const dueEnd = new Date(`${task.dueDate}T23:59:59`)

  if (completedDate < dueStart) {
    return 1.25
  }

  if (completedDate <= dueEnd) {
    return 1
  }

  return 0.5
}

export function calculateSubtaskXP(task) {
  const subtaskCount = (task.subtasks || []).length

  if (subtaskCount === 0) {
    return 0
  }

  return Math.max(1, Math.round((getBaseXP(task.priority) * 0.25) / subtaskCount))
}

export function calculateTaskCompletionXP(task) {
  return Math.round(getBaseXP(task.priority) * getDeadlineMultiplier(task))
}

export function calculateMissedDeadlinePenalty(task) {
  if (!task.dueDate || task.status === 'Completed') {
    return 0
  }

  const dueEnd = new Date(`${task.dueDate}T23:59:59`)

  if (new Date() <= dueEnd) {
    return 0
  }

  return -Math.round(getBaseXP(task.priority) * 0.3)
}

export function calculateTaskProgress(task) {
  if (task.status === 'Completed') {
    return 1
  }

  const subtasks = task.subtasks || []

  if (subtasks.length === 0) {
    return 0
  }

  return subtasks.filter((subtask) => subtask.completed).length / subtasks.length
}

export function calculateOceanHealth(tasks) {
  if (tasks.length === 0) {
    return 0
  }

  const progressTotal = tasks.reduce(
    (total, task) => total + calculateTaskProgress(task),
    0,
  )

  return Math.round((progressTotal / tasks.length) * 100)
}

export function flattenOceanItems(tasks) {
  return tasks.flatMap((task) => {
    const taskCompleted = calculateTaskProgress(task) === 1
    const taskItem = {
      id: `task-${task.id}`,
      type: 'task',
      title: task.title,
      parentTaskTitle: '',
      relatedGoal: task.relatedGoal,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
      completed: taskCompleted,
      iconType: taskCompleted ? 'life' : 'rubbish',
      size: 'large',
      xpValue: calculateTaskCompletionXP(task),
      description: task.description,
    }
    const subtaskItems = (task.subtasks || []).map((subtask) => ({
      id: `subtask-${task.id}-${subtask.id}`,
      type: 'subtask',
      title: subtask.title,
      parentTaskTitle: task.title,
      relatedGoal: task.relatedGoal,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
      completed: subtask.completed,
      iconType: subtask.completed ? 'life' : 'rubbish',
      size: 'small',
      xpValue: calculateSubtaskXP(task),
      description: task.description,
    }))

    return [taskItem, ...subtaskItems]
  })
}

export function calculateTaskStats(tasks) {
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
  const totalItems = totalTasks + totalSubtasks
  const completedItems = completedTasks + completedSubtasks
  const inProgressTasks = tasks.filter(
    (task) => task.status === 'In Progress',
  ).length

  return {
    totalTasks,
    completedTasks,
    pendingTasks: totalTasks - completedTasks,
    inProgressTasks,
    totalSubtasks,
    completedSubtasks,
    pendingSubtasks: totalSubtasks - completedSubtasks,
    activeTasks: totalTasks - completedTasks,
    totalItems,
    completedItems,
    pendingItems: totalItems - completedItems,
    oceanHealth: calculateOceanHealth(tasks),
    completionRate:
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
    taskCompletionRate:
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
    subtaskCompletionRate:
      totalSubtasks === 0
        ? 0
        : Math.round((completedSubtasks / totalSubtasks) * 100),
  }
}

export function calculateGoalStats(goals) {
  const totalGoals = goals.length
  const shortTermGoals = goals.filter((goal) => goal.type === 'Short-term').length
  const longTermGoals = goals.filter((goal) => goal.type === 'Long-term').length
  const averageGoalProgress =
    totalGoals === 0
      ? 0
      : Math.round(
          goals.reduce((total, goal) => total + Number(goal.progress || 0), 0) /
            totalGoals,
        )

  return {
    totalGoals,
    shortTermGoals,
    longTermGoals,
    averageGoalProgress,
    activeGoals: totalGoals,
  }
}

export function calculateOceanStats(tasks) {
  return calculateTaskStats(tasks)
}

export function calculateTotalXP(tasks) {
  const totalXP = tasks.reduce((total, task) => {
    const subtaskXP = (task.subtasks || []).reduce(
      (subtaskTotal, subtask) =>
        subtask.completed ? subtaskTotal + calculateSubtaskXP(task) : subtaskTotal,
      0,
    )
    const taskXP =
      calculateTaskProgress(task) === 1 ? calculateTaskCompletionXP(task) : 0

    return total + subtaskXP + taskXP + calculateMissedDeadlinePenalty(task)
  }, 0)

  return Math.max(0, Math.round(totalXP))
}

export function calculateLevel(totalXP) {
  const levels = [
    { number: 1, name: 'Starter', startXP: 0, nextLevelXP: 100 },
    { number: 2, name: 'Organizer', startXP: 100, nextLevelXP: 200 },
    { number: 3, name: 'Planner', startXP: 200, nextLevelXP: 300 },
    { number: 4, name: 'Achiever', startXP: 300, nextLevelXP: 400 },
    { number: 5, name: 'Master Scheduler', startXP: 400, nextLevelXP: 500 },
    { number: 6, name: 'Ocean Guardian', startXP: 500, nextLevelXP: null },
  ]
  const currentLevel =
    [...levels].reverse().find((level) => totalXP >= level.startXP) || levels[0]
  const nextLevelXP = currentLevel.nextLevelXP
  const xpNeededForNextLevel =
    nextLevelXP === null ? 0 : Math.max(nextLevelXP - totalXP, 0)
  const levelSpan =
    nextLevelXP === null ? 1 : nextLevelXP - currentLevel.startXP

  return {
    currentLevelNumber: currentLevel.number,
    currentLevelName: currentLevel.name,
    currentLevelLabel: `Level ${currentLevel.number} ${currentLevel.name}`,
    currentLevelStartXP: currentLevel.startXP,
    nextLevelXP,
    xpIntoCurrentLevel: totalXP - currentLevel.startXP,
    xpNeededForNextLevel,
    isMaxLevel: nextLevelXP === null,
    levelProgressPercent:
      nextLevelXP === null
        ? 100
        : Math.round(((totalXP - currentLevel.startXP) / levelSpan) * 100),
  }
}

export function calculateAchievements({
  tasks,
  goals = [],
  totalXP = 0,
  levelInfo,
  oceanHealth = calculateOceanHealth(tasks),
  scheduleGenerated = false,
  streakDays = 0,
}) {
  const taskStats = calculateTaskStats(tasks)
  const goalStats = calculateGoalStats(goals)
  const level = levelInfo || calculateLevel(totalXP)

  return [
    {
      name: 'First Step',
      description: 'Complete your first task',
      unlocked: taskStats.completedTasks >= 1,
      icon: '✓',
    },
    {
      name: 'Goal Getter',
      description: 'Create 3 goals',
      unlocked: goalStats.totalGoals >= 3,
      icon: '+',
    },
    {
      name: 'Schedule Starter',
      description: 'Generate your first schedule',
      unlocked: scheduleGenerated,
      icon: 'AI',
    },
    {
      name: 'Focus Builder',
      description: 'Complete 5 subtasks',
      unlocked: taskStats.completedSubtasks >= 5,
      icon: '5',
    },
    {
      name: 'Streak Starter',
      description: 'Maintain a 3-day streak',
      unlocked: streakDays >= 3,
      icon: '3',
    },
    {
      name: 'Ocean Guardian',
      description: 'Restore the full ocean',
      unlocked: oceanHealth === 100 && taskStats.totalTasks > 0,
      icon: '🌊',
    },
    {
      name: 'Planner Pro',
      description: 'Complete all tasks',
      unlocked:
        taskStats.completedTasks === taskStats.totalTasks &&
        taskStats.totalTasks > 0,
      icon: 'P',
    },
    {
      name: 'Master Scheduler',
      description: 'Reach Level 5',
      unlocked: level.currentLevelNumber >= 5,
      icon: '5',
    },
  ]
}
