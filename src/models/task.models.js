import mongoose from "mongoose";
import { TaskStatusEnum } from "../utils/constants.js";

const taskSchema = new mongoose.Schema(
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
      required: true, //it depends on project structure
    },
    assignBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
