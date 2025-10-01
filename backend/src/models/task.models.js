import mongoose from "mongoose";
import { TaskStatusEnum, ProjectPriorityEnum } from "../utils/constants.js";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    status: {
      type: String,
      enum: TaskStatusEnum,
      default: TaskStatusEnum[0],
    },
    priority: {
      type: String,
      enum: ProjectPriorityEnum,
      default: ProjectPriorityEnum[0],
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
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project ID is required"],
    },
    assignTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true, //it depends on project structure
    },
    assignBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
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
  },
  {
    timestamps: true,
  },
);

export const Task = mongoose.model("Task", taskSchema);
