import { Schema, model, models } from 'mongoose';

export type GoalStatus = "active" | "completed";

export interface GoalDocument {
    title: string;
    description?: string;
    status: GoalStatus;
    targetDate?: Date;
    progress: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

const GoalSchema = new Schema<GoalDocument>(
    {
        title:{
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: '',
        },
        status: {
            type: String,
            enum: ['active', 'completed'],
            default: 'active',
        },
        targetDate: {
            type: Date,
        },
        progress: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        tags: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

export const Goal = models.Goal || model<GoalDocument>('Goal', GoalSchema);

export default Goal;