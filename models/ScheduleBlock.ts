import { Schema, model, models } from "mongoose";

export type ScheduleBlockStatus = "scheduled" | "completed" | "missed";

export interface ScheduleBlockDocument {
    userId: string;
    taskId?: string;
    title: string;
    date: Date;
    startTime: string;
    endTime: string;
    status: ScheduleBlockStatus;
    createdAt: Date;
    updatedAt: Date;
}

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const ScheduleBlockSchema = new Schema<ScheduleBlockDocument>(
    {
        userId: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        taskId: {
            type: String,
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        date: {
            type: Date,
            required: true,
            index: true,
        },
        startTime: {
            type: String,
            required: true,
            match: timePattern,
        },
        endTime: {
            type: String,
            required: true,
            match: timePattern,
        },
        status: {
            type: String,
            enum: ["scheduled", "completed", "missed"],
            default: "scheduled",
        },
    },
    {
        timestamps: true,
    }
);

export const ScheduleBlock =
    models.ScheduleBlock ||
    model<ScheduleBlockDocument>("ScheduleBlock", ScheduleBlockSchema);

export default ScheduleBlock;

