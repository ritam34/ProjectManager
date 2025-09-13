import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Project } from "../models/project.models.js";

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
    const project = await ProjectMember.findOne({
      projectId,
      user: req.user._id,
    }).populate("project", "createdBy title description");
    if (!project) {
      throw new ApiError(400, "give a valid project id ");
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
      projectId,
      { title, description },
      { new: true },
    );
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
    const project = await Project.findByIdAndDelete(projectId);
    if (!project) {
      throw new ApiError(400, "Project not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, null, "project delete successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server Error", error.message);
  }
});

const addMemberToProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { userId, role } = req.body;
  try {
    if (!projectId) {
      throw new ApiError(400, "give a projectId to add member");
    }
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(400, "Project not found");
    }
    if (!userId) {
      throw new ApiError(400, "give a userId to add member");
    }
    if (!role) {
      throw new ApiError(400, "give a role to add member");
    }
    const addMember = await ProjectMember.create({
      project: projectId,
      user: userId,
      role,
    });
    if (!addMember) {
      throw new ApiError(400, "member not added");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, addMember, "member added successfully"));
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
      "user", "username avatar fullname"
    );
    if (!projectMembers) {
      throw new ApiError(400, "ProjectMembers not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, projectMembers, "members fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server Error", error.message);
    
  }
});

// const updateProjectMember = asyncHandler(async (req, res) => {});

const updateMemberRole = asyncHandler(async (req, res) => {
   const { projectId } = req.params;
    const { userId, role } = req.body;
  try {
    if (!projectId) {
      throw new ApiError(400, "give a projectId to update Member role");
    }
    if (!userId) {
      throw new ApiError(400, "give a userId to update member");
    }
    if (!role) {
      throw new ApiError(400, "give a role to update");
    }
    const memberRole=await ProjectMember.findByIdAndUpdate({userId,projectId},{role},{new:true});
    if(!memberRole){
      throw new ApiError(400,"project or user not found to update")
    }
    return res
      .status(200)
      .json(new ApiResponse(200, memberRole, "members update successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server Error", error.message);
    
  }
});

const deleteMember = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
    const { userId } = req.body;
    try {
      if (!projectId) {
      throw new ApiError(400, "give a projectId to delete Member ");
    }
    if (!userId) {
      throw new ApiError(400, "give a userId to delete member");
    }
    const memberDelete=await ProjectMember.findByIdAndDelete({userId,projectId});
    if(!memberDelete){
      throw new ApiError(400,"user or project not found to delete")
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
