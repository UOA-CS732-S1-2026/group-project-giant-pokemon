
# MVP Module Spec

## 1. User Management Module

### Module Overview

Responsible for user registration, login, authentication, and basic user information management. All business data must be linked to specific users.

### Core Functionalities

-   User registration
-   User login
-   Authentication
-   Fetch current user profile
-   Update basic user profile

### Data Model
```TypeScript
type  User  = {  
_id: string  
email: string  
passwordHash: string  
name?: string  
createdAt: Date  
updatedAt: Date  
}
```

### API Design
TBD

### Key Rules

-   Email must be unique
-   Password must be stored as hash
-   Other modules should not store user information directly
-   Other modules should reference userId

### Dependencies

Depends on:

-   None

Used by:

-   Goal Module
-   Task Module
-   Schedule Module
-   Gamification Module

## 2. Goal Management Module

### Module Overview

Responsible for creating and managing users' goals, serving as the **upstream input** for task decomposition, task management, and schedule generation.

### Core Functionalities

-   Create goal
-   View goal list
-   View goal detail
-   Update goal
-   Delete goal
-   Mark goal as active / completed


```TypeScript
type goal =  {

title:  string;

description?:  string;

status:  GoalStatus;

targetDate?:  Date;

progress:  number;

tags:  string[];

createdAt:  Date;

updatedAt:  Date;

}
```
### API Design

```TypeScript
POST  /api/goals  
GET  /api/goals  
GET  /api/goals/:id  
PUT  /api/goals/:id  
DELETE  /api/goals/:id
```

### Key Rules

-   Each goal must belong to one user
-   Only the owner can view/update/delete the goal
-   Goal title is required
-   Completed goals should not be used as active scheduling inputs by default

### Dependencies

Depends on:

-   User Management Module

Used by:

-   Task Management Module
-   Schedule Module
-   AI Task Decomposition Module

## 3. Task Management Module

### Module Overview

Responsible for the creation, update, deletion, and status management of specific tasks. Tasks must be associated with a particular goal.

### Core Functionalities

-   Create task
-   View task list
-   View task detail
-   Update task
-   Delete task
-   Mark task as todo / in progress / completed
-   Link task to a goal
-   Manage priority and deadline

### Data Model

```TypeScript
type  Task  = {  
 _id: string  
 userId: string  
 goalId?: string  
 title: string  
 description?: string  
 status: "todo"  |  "in_progress"  |  "completed"  
 priority: "low"  |  "medium"  |  "high"  
 deadline?: Date  
 estimatedMinutes?: number  
 createdAt: Date  
 updatedAt: Date  
}
```

### API Design

```
POST  /api/tasks  
GET  /api/tasks  
GET  /api/tasks/:id  
PATCH  /api/tasks/:id  
DELETE  /api/tasks/:id
```

Optional filter examples:

```
GET  /api/tasks?goalId=xxx  
GET  /api/tasks?status=todo  
GET  /api/tasks?priority=high
```

### Key Rules

-   Each task must belong to one user
-   A task may optionally belong to a goal
-   Completed tasks should not be scheduled again
-   Deadline and estimatedMinutes are important inputs for scheduling
-   priority should be simple for MVP: low / medium / high

### Dependencies

Depends on:

-   User Management Module
-   Goal Management Module

Used by:

-   Schedule Module
-   Gamification Module

## 4. Schedule Module

### Module Overview
Responsible for generating daily schedules based on user tasks, deadlines, priorities, and available time. It is one of the most core value modules within the MVP.

### Core Functionalities

-   Generate daily schedule
-   View schedule by date
-   Add scheduled task block
-   Update scheduled task block
-   Delete scheduled task block
-   Mark scheduled block as completed / missed
-   Re-generate schedule after missed tasks

### Data Model

```TypeScript
type  ScheduleBlock  = {  
 _id: string  
 userId: string  
 taskId?: string  
 title: string  
 date: Date  
 startTime: string  
 endTime: string  
 status: "scheduled"  |  "completed"  |  "missed"  
 createdAt: Date  
 updatedAt: Date  
}
```

### API Design

```TypeScript
POST  /api/schedules/generate  
GET  /api/schedules?date=YYYY-MM-DD  
POST  /api/schedules  
PATCH  /api/schedules/:id  
DELETE  /api/schedules/:id  
POST  /api/schedules/regenerate
```

### Key Rules

-   Schedule generation should only use active, incomplete tasks
-   Higher-priority and closer-deadline tasks should be scheduled earlier
-   A scheduled block may or may not link to a task
-   If a scheduled task is missed, it should be available for re-planning
-   MVP does not need perfect optimisation; rule-based scheduling is acceptable

### Dependencies

Depends on:

-   User Management Module
-   Task Management Module
-   Goal Management Module

Used by:

-   Gamification Module
-   Calendar View

## 5. Gamification Module

### Module Overview

Responsible for basic incentive mechanisms, such as streaks, XP, and completed task counts. This should remain simple during the MVP stage; avoid implementing complex leveling systems.

### Core Functionalities
TBD

### Data Model
TBD


### API Design
TBD

### Key Rules
TBD

### Dependencies
Depends on:

-   User Management Module
-   Task Management Module
-   Schedule Module