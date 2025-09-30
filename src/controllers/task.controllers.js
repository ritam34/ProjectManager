import { Task } from "../models/task.models.js";
import { ApiError } from "../utils/api-error.js";
import { TaskStatusEnum } from "../utils/constants.js";
import { ApiResponse } from "../utils/api-response.js";
import { Subtask } from "../models/subtask.models.js";
import {AvailableProjectPriority,AvailableUserRoles} from "../utils/constants.js";

// get all tasks
const getTasks = async (req, res) => {
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
};

// get task by id
const getTaskById = async (req, res) => {
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
};

const createTask = async (req, res) => {
  // create task
  const { projectId } = req.params
  const { title, description, priority, dueDate } = req.body;
  // status,createdBy,project,assignBy,attachments, assignTo
  try {
    if (!Object.values(AvailableUserRoles).includes(req.user.role)) {
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
    })
      .populate("createdBy", "fullname email")
      .populate("project", "name description");
    if (!task) {
      throw new ApiError(400, "task not created");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, task, "task created successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
};

// update task
const updateTask = async (req, res) => {
  // update task
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
    if (req.user.role !== "Admin" || req.user.role !== "project-admin") {
      throw new ApiError(403, "you don't have permission to procced");
    }
    if (
      !title ||
      !description ||
      !priority ||
      !dueDate ||
      !status ||
      !assignTo ||
      !attachments
    ) {
      throw new ApiError(400, "give something to update");
    }
    const updates = {
      title,
      description,
      priority,
      dueDate,
      status,
      assignTo,
      attachments,
    };

    // remove undefined (or null if you want)
    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });
    const task = await Task.findByIdAndUpdate(taskId, updates, { new: true });
    if (!task) {
      throw new ApiError(400, "task not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, task, "task updated successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
};

// delete task
const deleteTask = async (req, res) => {
  // delete task
  const { taskId } = req.params;
  try {
    if (!taskId) {
      throw new ApiError(400, "TaskId is required");
    }
    if (
      req.user.role !== "Admin" ||
      req.user.role !== "project-admin" ||
      req.user._id !== task.assignBy
    ) {
      throw new ApiError(403, "you don't have permission to procced");
    }
    const task = await Task.findByIdAndDelete(taskId);
    if (!task) {
      throw new ApiError(400, "task not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, task, "task deleted successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
};

// -----------------------------------
// subtask controllers
// feilds: title, description, status, priority, dueDate, createdBy, task, assignTo, attachments, isCompleted

// create subtask
const createSubTask = async (req, res) => {
  // create subtask
  const { taskId } = req.params;
  const { title, description, priority, dueDate } = req.body;
  try {
    if (!taskId) {
      throw new ApiError(400, "TaskId is required");
    }
    if (
      req.user.role !== "admin" ||
      req.user.role !== "project-admin" ||
      req.user.role !== "member"
    ) {
      throw new ApiError(403, "you don't have permission to procced");
    }
    if (!title || !description || !priority || !dueDate) {
      throw new ApiError(400, "All fields are required");
    }
    const subtask = await SubTask.create({
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
};

const getSubTasks = async (req, res) => {
  // get all subtasks of a task
  const { taskId } = req.params;
  try {
    if (!taskId) {
      throw new ApiError(400, "TaskId is required");
    }
    const subtasks = await SubTask.find({ task: taskId })
      .populate("createdBy", "username fullname avatar")
      .populate("task", "title description")
      .populate("assignTo", "username fullname avatar")
      .populate("assignBy", "username fullname avatar")
      .populate("attachments");
    if (!subtasks) {
      throw new ApiError(400, "subtasks not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, subtasks, "subtasks fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
};

const getSubTaskById = async (req, res) => {
  // get subtask by id
  const { subtaskId } = req.params;
  try {
    if (!subtaskId) {
      throw new ApiError(400, "SubtaskId is required");
    }
    const subtask = await SubTask.findById(subtaskId)
      .populate("createdBy", "username fullname avatar")
      .populate("task", "title description")
      .populate("assignTo", "username fullname avatar")
      .populate("assignBy", "username fullname avatar")
      .populate("attachments");
    if (!subtask) {
      throw new ApiError(400, "subtask not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, subtask, "subtask fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
};

// update subtask
const updateSubTask = async (req, res) => {
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
    if (
      req.user.role !== "admin" ||
      req.user.role !== "project-admin" ||
      req.user.role !== "member"
    ) {
      throw new ApiError(403, "you don't have permission to procced");
    }
    if (
      !title ||
      !description ||
      !priority ||
      !dueDate ||
      !status ||
      !assignTo ||
      !attachments ||
      !isCompleted
    ) {
      throw new ApiError(400, "give something to update");
    }
    const updates = {
      title,
      description,
      priority,
      dueDate,
      status,
      assignTo,
      attachments,
      isCompleted,
    };

    // remove undefined (or null if you want)
    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });
    const subtask = await SubTask.findByIdAndUpdate(subtaskId, updates, {
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
};

// delete subtask
const deleteSubTask = async (req, res) => {
  // delete subtask
  const { subtaskId } = req.params;
  try {
    if (!subtaskId) {
      throw new ApiError(400, "SubtaskId is required");
    }
    if (
      req.user.role !== "admin" ||
      req.user.role !== "project-admin" ||
      req.user.role !== "member"
    ) {
      throw new ApiError(403, "you don't have permission to procced");
    }
    const subtask = await SubTask.findByIdAndDelete(subtaskId);
    if (!subtask) {
      throw new ApiError(400, "subtask not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, subtask, "subtask deleted successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
};

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
