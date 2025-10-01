import { Task } from "../models/task.models.js";
import { ApiError } from "../utils/api-error.js";
import { TaskStatusEnum } from "../utils/constants.js";
import { ApiResponse } from "../utils/api-response.js";
import { Subtask } from "../models/subtask.models.js";
import { Note } from "../models/note.models.js";
import { Project } from "../models/project.models.js";
import {
  AvailableProjectPriority,
  AvailableUserRoles,
  UserRolesEnum,
} from "../utils/constants.js";
import { asyncHandler } from "../utils/async.handler.js";
import mongoose from "mongoose";

// get all tasks
const getTasks = asyncHandler(async (req, res) => {
  // get all tasks of a project
  const { projectId } = req.params;
  try {
    if (!projectId) {
      throw new ApiError(400, "ProjectId is required");
    }
    const tasks = await Task.find({ project: projectId })
      .populate("createdBy", "fullname email")
      .populate("project", "name description")
      .populate("assignTo", "fullname email")
      .populate("assignBy", "fullname email");
    if (!tasks) {
      throw new ApiError(400, "No tasks found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

// get task by id
const getTaskById = asyncHandler(async (req, res) => {
  // get task by id
  const { taskId } = req.params;
  try {
    if (!taskId) {
      throw new ApiError(400, "TaskId is required");
    }
    const task = await Task.findById(taskId)
      .populate("createdBy", "fullname email")
      .populate("project", "name description")
      .populate("assignTo", "fullname email")
      .populate("assignBy", "fullname email");
    if (!task) {
      throw new ApiError(400, "Task not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, task, "Task fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

const createTask = asyncHandler(async (req, res) => {
  // create task
  const { projectId } = req.params;
  const { title, description, priority, dueDate } = req.body;
  // status,createdBy,project,assignBy,attachments, assignTo
  try {
    if (
      ![UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN].includes(
        req.user.role,
      )
    ) {
      throw new ApiError(403, "you don't have permission to procced");
    }
    if (!title || !description || !priority || !dueDate) {
      throw new ApiError(400, "All fields are required");
    }
    if (!projectId) {
      throw new ApiError(400, "ProjectId is required");
    }
    if (!Object.values(AvailableProjectPriority).includes(priority)) {
      throw new ApiError(400, "give a valid priority");
    }
    //create task
    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      status: TaskStatusEnum.TODO,
      createdBy: req.user._id,
      project: projectId,
      assignBy: req.user._id,
    });
    if (!task) {
      throw new ApiError(400, "task not created");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, task, "task created successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

// update task
const updateTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const {
    title,
    description,
    priority,
    dueDate,
    status,
    assignTo,
    attachments,
  } = req.body;

  try {
    if (!taskId) {
      throw new ApiError(400, "TaskId is required");
    }
    if (
      ![UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN].includes(
        req.user.role,
      )
    ) {
      throw new ApiError(403, "You don't have permission to proceed");
    }
    const updatableFields = {
      title,
      description,
      priority,
      dueDate,
      status,
      assignTo,
      attachments,
    };
    const updateData = {};
    Object.entries(updatableFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        updateData[key] = value;
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, "Provide at least one field to update");
    }

    const task = await Task.findOneAndUpdate({ _id: taskId }, updateData, {
      new: true,
    });

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, task, "Task updated successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal Server Error");
  }
});

// delete task
const deleteTask = asyncHandler(async (req, res) => {
  // delete task
  const { taskId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!taskId) {
      throw new ApiError(400, "TaskId is required");
    }
    if (
      ![UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN].includes(
        req.user.role,
      )
    ) {
      throw new ApiError(403, "you don't have permission to procced");
    }
    const task = await Task.findOneAndDelete({ _id: taskId }, { session });
    if (!task) {
      throw new ApiError(400, "task not found");
    }
    const project = await Project.findById(task.project);
    if (!project) {
      throw new ApiError(400, "project not found");
    }
    await Subtask.deleteMany({ project: project._id }, { session });
    // Commit if everything is fine
    await session.commitTransaction();
    session.endSession();
    return res
      .status(200)
      .json(new ApiResponse(200, task, "task deleted successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

// create subtask
const createSubTask = asyncHandler(async (req, res) => {
  // create subtask
  const { taskId } = req.params;
  const { title, description, priority, dueDate } = req.body;
  try {
    if (!taskId) {
      throw new ApiError(400, "TaskId is required");
    }
    if (!Object.values(AvailableUserRoles).includes(req.user.role)) {
      throw new ApiError(403, "you don't have permission to procced");
    }
    if (!title || !description || !priority || !dueDate) {
      throw new ApiError(400, "All fields are required");
    }
    // feilds: title, description, status, priority, dueDate, createdBy, task, assignTo, attachments, isCompleted
    const subtask = await Subtask.create({
      title,
      description,
      priority,
      dueDate,
      status: TaskStatusEnum.TODO,
      createdBy: req.user._id,
      task: taskId,
    });
    if (!subtask) {
      throw new ApiError(400, "subtask not created");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, subtask, "subtask created successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

const getSubTasks = asyncHandler(async (req, res) => {
  // get all subtasks of a task
  const { taskId } = req.params;
  try {
    if (!taskId) {
      throw new ApiError(400, "TaskId is required");
    }
    const subtasks = await Subtask.find({ task: taskId })
      .populate("createdBy", "username fullname avatar")
      .populate("task", "title description");
    if (!subtasks) {
      throw new ApiError(400, "subtasks not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, subtasks, "subtasks fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

const getSubTaskById = asyncHandler(async (req, res) => {
  // get subtask by id
  const { subtaskId } = req.params;
  try {
    if (!subtaskId) {
      throw new ApiError(400, "SubtaskId is required");
    }
    const subtask = await Subtask.findById(subtaskId)
      .populate("createdBy", "username fullname avatar")
      .populate("task", "title description");
    if (!subtask) {
      throw new ApiError(400, "subtask not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, subtask, "subtask fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

// update subtask
const updateSubTask = asyncHandler(async (req, res) => {
  // update subtask
  const { subtaskId } = req.params;
  const {
    title,
    description,
    priority,
    dueDate,
    status,
    assignTo,
    attachments,
    isCompleted,
  } = req.body;
  try {
    if (!subtaskId) {
      throw new ApiError(400, "SubtaskId is required");
    }
    if (!Object.values(AvailableUserRoles).includes(req.user.role)) {
      throw new ApiError(403, "you don't have permission to procced");
    }
    const updatableFields = {
      title,
      description,
      priority,
      dueDate,
      status,
      assignTo,
      attachments,
      isCompleted,
    };
    const updateData = {};
    Object.entries(updatableFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        updateData[key] = value;
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, "Provide at least one field to update");
    }

    const subtask = await Subtask.findByIdAndUpdate(subtaskId, updateData, {
      new: true,
    });
    if (!subtask) {
      throw new ApiError(400, "subtask not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, subtask, "subtask updated successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

// delete subtask
const deleteSubTask = asyncHandler(async (req, res) => {
  // delete subtask
  const { subtaskId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!subtaskId) {
      throw new ApiError(400, "SubtaskId is required");
    }
    if (
      !Object.values(AvailableUserRoles).includes(req.user.role)
    ) {
      throw new ApiError(403, "you don't have permission to procced");
    }
    const subtask = await Subtask.findByIdAndDelete(subtaskId,{session});
    if (!subtask) {
      throw new ApiError(400, "subtask not found");
    }
    await session.commitTransaction();
    session.endSession();
    return res
      .status(200)
      .json(new ApiResponse(200, subtask, "subtask deleted successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

export {
  createSubTask,
  createTask,
  deleteSubTask,
  deleteTask,
  getTaskById,
  getTasks,
  getSubTasks,
  getSubTaskById,
  updateSubTask,
  updateTask,
};
