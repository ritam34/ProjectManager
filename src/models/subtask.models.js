import mongoose from "mongoose";
import { TaskStatusEnum } from "../utils/constants.js";

// feilds: title, description, status, priority, dueDate, createdBy, task, assignTo, attachments, isCompleted

const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: TaskStatusEnum,
      default: TaskStatusEnum[0],
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    assignTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true, //it depends on project structure
    },
    attachments: {
      type: [
        {
          url: String,
          mimeType: String,
          size: Number,
          fileName: String,
        },
      ],
      default: [],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Subtask = mongoose.model("Subtask", subtaskSchema);
