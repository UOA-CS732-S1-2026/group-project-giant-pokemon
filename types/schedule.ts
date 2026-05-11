export type ScheduleBlockStatus = "scheduled" | "completed" | "missed";

export type ScheduleBlockAPI = {
    _id: string;
    userId: string;
    taskId?: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    status: ScheduleBlockStatus;
    createdAt: string;
    updatedAt: string;
};

export type ScheduleBlock = Omit<ScheduleBlockAPI, "_id"> & {
    id: string;
};

