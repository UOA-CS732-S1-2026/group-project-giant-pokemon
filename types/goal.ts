// Define a type for the status of a Goal
export type GoalStatus = "active" | "completed";

// Define raw API response type for Goal
export type GoalAPI = {
    _id: string;
    title: string;
    description?: string;
    status: GoalStatus;
    targetDate?: string;
    progress: number;
    tags: string[];
    createdAt: string;
    updatedAt: string;
};

// Define a type for the Goal used in the React component, mapping _id to id
export type Goal = Omit<GoalAPI, "_id"> & { 
    id: string;
};