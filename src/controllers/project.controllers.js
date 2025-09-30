import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Project } from "../models/project.models.js";
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";
import { asyncHandler } from "../utils/async.handler.js";
import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { Task } from "../models/task.models.js";
import { Subtask } from "../models/subtask.models.js";
import { Note } from "./../models/note.models.js";

// check all controllers
const getAllProject = asyncHandler(async (req, res) => {
  const _id = req.user._id;
  try {
    if (!_id) {
      throw new ApiError(400, "please log in required");
    }
    // in projectMember find where roles equal to _id
    const projects = await ProjectMember.aggregate([
      { $match: { user: _id } },
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "projectDetails",
        },
      },
      { $unwind: "$projectDetails" },
      {
        $replaceRoot: { newRoot: "$projectDetails" },
      },
    ]);

    if (!projects) {
      throw new ApiError(400, "you do not have any project");
    }
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          project: projects.length === 0 ? null : projects,
          projectCount: projects.length,
        },
        "Projects fetched successfully",
      ),
    );
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  try {
    if (!projectId) {
      throw new ApiError(400, "give a project id");
    }

    if (
      req.user.role === UserRolesEnum.ADMIN ||
      req.user.role === UserRolesEnum.PROJECT_ADMIN ||
      req.user.role === UserRolesEnum.MEMBER
    ) {
      const projectDetails = await ProjectMember.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.user._id),
            project: new mongoose.Types.ObjectId(projectId),
          },
        },
        {
          $lookup: {
            from: "projects",
            localField: "project",
            foreignField: "_id",
            as: "projectDetails",
          },
        },
        { $unwind: "$projectDetails" },
        {
          // merge role from ProjectMember with projectDetails
          $addFields: {
            role: "$role",
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ["$projectDetails", { role: "$role" }],
            },
          },
        },
      ]);
      if (!projectDetails) {
        throw new ApiError(400, "you are not a member of this project");
      }
      return res
        .status(200)
        .json(
          new ApiResponse(200, projectDetails, "Project fetched successfully"),
        );
    } else {
      throw new ApiError(
        400,
        "give a valid project id or you are not a member of this project",
      );
    }
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
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
    const projectMember = await ProjectMember.create({
      user: req.user._id,
      project: newProject._id,
      role: UserRolesEnum.ADMIN,
    });
    if (!newProject || !projectMember) {
      throw new ApiError(400, "project not created");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, newProject, "Project created successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
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
    const projectDetails = await Project.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(projectId) },
      { title, description },
      { new: true },
    ).populate("createdBy", "username fullname avatar");
    if (!projectDetails) {
      throw new ApiError(400, "project not found");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, projectDetails, "project updated successfully"),
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!projectId) {
      throw new ApiError(400, "give a projectId to delete");
    }
    const project = await Project.findByIdAndDelete(
      {
        _id: projectId,
        createdBy: req.user._id,
      },
      { session },
    );
    if (!project) {
      throw new ApiError(400, "Project not found");
    }
    await ProjectMember.deleteMany({ project: project._id }, { session });
    await Task.deleteMany({ project: project._id }, { session });
    await Subtask.deleteMany({ project: project._id }, { session });
    await Note.deleteMany({ project: project._id }, { session });

    // Commit if everything is fine
    await session.commitTransaction();
    session.endSession();
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Project delete successfully"));
  } catch (error) {
    if (error.message.includes("Transaction numbers are only allowed")) {
      await session.abortTransaction();
      session.endSession();
      try {
        const project = await Project.findOneAndDelete({
          _id: req.params.projectId,
          createdBy: req.user._id,
        });

        if (!project) {
          throw new ApiError(
            404,
            "Project not found or you don't have permission",
          );
        }

        await Promise.all([
          ProjectMember.deleteMany({ project: project._id }),
          Task.deleteMany({ project: project._id }),
          Subtask.deleteMany({ project: project._id }),
          Note.deleteMany({ project: project._id }),
        ]);

        return res.status(200).json({
          success: true,
          message: "Project and related data deleted successfully",
        });
      } catch (error) {
        throw new ApiError(500, error.message || "Internal server Error");
      }
    }
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
    const userId = await User.findOne({ username }).select("_id");
    if (!userId) {
      throw new ApiError(400, "user not found");
    }
    const checkAlreadyMember = await ProjectMember.findOne({
      project: projectId,
      user: userId,
    });
    if (checkAlreadyMember) {
      throw new ApiError(
        400,
        "user is already a member of this project go to update role",
      );
    }
    const project = await Project.findById(projectId);
    //req.user._id should be admin or owner
    if (!project) {
      throw new ApiError(400, "Project not found");
    }
    const isOwner = project.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isProjectAdmin = req.user.role === "project-admin";

    if (!(isOwner || isAdmin || isProjectAdmin)) {
      throw new ApiError(403, "You are not an owner or admin of this project");
    }
    if (!username) {
      throw new ApiError(400, "give a username to add as member");
    }

    if (!role || !Object.values(AvailableUserRoles).includes(role)) {
      throw new ApiError(400, "give a valid role to update");
    }
    const addMember = await ProjectMember.create({
      user: userId,
      project: projectId,
      role,
    });
    if (!addMember) {
      throw new ApiError(400, "Member not added");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, addMember, "Member added successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  try {
    if (!projectId) {
      throw new ApiError(400, "give a projectId to fetch");
    }

    const projectMembers = await ProjectMember.find({
      project: new mongoose.Types.ObjectId(projectId),
    }).populate("user", "username avatar fullname");
    if (!projectMembers) {
      throw new ApiError(400, "ProjectMembers not found");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, projectMembers, "members fetched successfully"),
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
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
    if (!role || !Object.values(AvailableUserRoles).includes(role)) {
      throw new ApiError(400, "give a valid role to update");
    }
    const memberRole = await ProjectMember.findOneAndUpdate(
      { user: userId, project: projectId },
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
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

// create a controller to add multiple member with there role

const deleteMember = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { username } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();
  if (!username) {
    throw new ApiError(400, "give a usename to delete member");
  }
  const userId = await User.findOne({ username }).select("_id");
  if (!userId) {
    throw new ApiError(400, "user not found");
  }
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
    const memberDelete = await ProjectMember.findOneAndDelete(
      {
        user: userId,
        project: projectId,
      },
      { session },
    );
    if (!memberDelete) {
      throw new ApiError(400, "user or project not found to delete");
    }
    const project = await Project.findById(projectId);
    await Task.deleteMany({ project: project._id }, { session });
    await Subtask.deleteMany({ project: project._id }, { session });
    await Note.deleteMany({ project: project._id }, { session });

    // Commit if everything is fine
    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "members delete successfully"));
  } catch (error) {
    if (error.message.includes("Transaction numbers are only allowed")) {
      try {
        await session.abortTransaction();
        session.endSession();
        const memberDelete = await ProjectMember.findOneAndDelete({
          user: userId,
          project: projectId,
        });
        if (!memberDelete) {
          throw new ApiError(400, "user or project not found to delete");
        }
        const project = await Project.findById(projectId);
        await Promise.all([
          Task.deleteMany({ project: project._id }),
          Subtask.deleteMany({ project: project._id }),
          Note.deleteMany({ project: project._id }),
        ]);
        return res
          .status(200)
          .json(new ApiResponse(200, null, "members delete successfully"));
      } catch (error) {
        throw new ApiError(500, error.message || "Internal server Error");
      }
    }
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
