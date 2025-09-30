import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Project } from "../models/project.models.js";
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";
import {asyncHandler} from "../utils/async.handler.js"

// check all controllers
const getAllProject = asyncHandler(async (req, res) => {
  const _id = req.user._id;
  try {
    if (!_id) {
      throw new ApiError(400, "please log in required");
    }
    // in projectMember find where roles equal to _id
    const projects = await ProjectMember.find({ user: _id }).populate(
      "project",
      "name description createdBy",
    );
    if (!projects) {
      throw new ApiError(400, "you do not have any project");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, projects, "Projects fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server Error", error.message);
  }
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  try {
    if (!projectId) {
      throw new ApiError(400, "give a project id");
    }
    //
    if (req.user.role) {
      const project = await ProjectMember.findOne({
        projectId,
        user: req.user._id,
      }).populate("project", "createdBy title description");
      if (!project) {
        throw new ApiError(400, "you are not a member of this project");
      }
    } else {
      throw new ApiError(
        400,
        "give a valid project id or you are not a member of this project",
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, project, "Project fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server Error", error.message);
  }
});

const createProject = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  try {
    if (!title && !description) {
      throw new ApiError(400, "give a title and description");
    }
    const newProject = await Project.create({
      createdBy: req.user._id,
      title,
      description,
    });
    if (!newProject) {
      throw new ApiError(400, "project not created");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, newProject, "Project created successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server Error", error.message);
  }
});

const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title, description } = req.body;
  try {
    if (!projectId) {
      throw new ApiError(400, "give a projectId to update");
    }
    if (!title || !description) {
      throw new ApiError(400, "give a title or description to update");
    }
    const project = await Project.findOneAndUpdate(
      { projectId, createdBy: req.user._id },
      { title, description },
      { new: true },
    ).populate("createdBy", "username fullname avatar");
    if (!project) {
      throw new ApiError(400, "project not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, project, "project updated successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server Error", error.message);
  }
});

const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  try {
    if (!projectId) {
      throw new ApiError(400, "give a projectId to delete");
    }
    const project = await Project.findByIdAndDelete({
      projectId,
      createdBy: req.user._id,
    });
    if (!project) {
      throw new ApiError(400, "Project not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Project delete successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server Error", error.message);
  }
});

// member controllers
const addMemberToProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { username, role } = req.body;
  try {
    if (!projectId) {
      throw new ApiError(400, "give a projectId to add member");
    }
    const project = await Project.findById(projectId);
    //req.user._id should be admin or owner
    if (!project) {
      throw new ApiError(400, "Project not found");
    }
    if (
      project.createdBy.toString() !== req.user._id ||
      req.user.role !== "admin" ||
      req.user.role !== "project-admin"
    ) {
      throw new ApiError(400, "you are not a owner or admin of this project");
    }
    if (!username) {
      throw new ApiError(400, "give a username to add as member");
    }
    const userId = await User.findOne({ username }).select("_id");
    if (!userId) {
      throw new ApiError(400, "user not found");
    }
    if (
      !role ||
      !UserRolesEnum.includes(role) ||
      !AvailableUserRoles.includes(role)
    ) {
      throw new ApiError(400, "give a valid role to update");
    }
    const addMember = await ProjectMember.create({
      project: projectId,
      user: userId,
      role,
    }).populate("user", "username avatar fullname");
    if (!addMember) {
      throw new ApiError(400, "Member not added");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, addMember, "Member added successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server Error", error.message);
  }
});

const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  try {
    if (!projectId) {
      throw new ApiError(400, "give a projectId to fetch");
    }
    const projectMembers = await ProjectMember.findById(projectId).populate(
      "user",
      "username avatar fullname",
    );
    if (!projectMembers) {
      throw new ApiError(400, "ProjectMembers not found");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, projectMembers, "members fetched successfully"),
      );
  } catch (error) {
    throw new ApiError(500, "Internal server Error", error.message);
  }
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { username, role } = req.body;
  try {
    if (!projectId) {
      throw new ApiError(400, "give a projectId to update Member role");
    }
    if (!username) {
      throw new ApiError(400, "give a usename to update member");
    }
    const userId = await User.findOne({ username }).select("_id");
    if (!userId) {
      throw new ApiError(400, "user not found");
    }
    if (
      !role ||
      !UserRolesEnum.includes(role) ||
      !AvailableUserRoles.includes(role)
    ) {
      throw new ApiError(400, "give a valid role to update");
    }
    const memberRole = await ProjectMember.findByIdAndUpdate(
      { userId, projectId },
      { role },
      { new: true },
    );
    if (!memberRole) {
      throw new ApiError(400, "project or user not found to update");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, memberRole, "Member update successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server Error", error.message);
  }
});

// create a controller to add multiple member with there role

const deleteMember = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { username } = req.body;
  try {
    if (
      req.user.role !== UserRolesEnum.ADMIN &&
      req.user.role !== UserRolesEnum.PROJECT_ADMIN
    ) {
      throw new ApiError(403, "you don't have permission to delete member");
    }
    if (!projectId) {
      throw new ApiError(400, "give a projectId to delete Member ");
    }
    if (!username) {
      throw new ApiError(400, "give a usename to delete member");
    }
    const userId = await User.findOne({ username }).select("_id");
    if (!userId) {
      throw new ApiError(400, "user not found");
    }
    const memberDelete = await ProjectMember.findByIdAndDelete({
      userId,
      projectId,
    });
    if (!memberDelete) {
      throw new ApiError(400, "user or project not found to delete");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, null, "members delete successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server Error", error.message);
  }
});

export {
  getAllProject,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMemberToProject,
  getProjectMembers,
  updateMemberRole,
  deleteMember,
};
