import { asyncHandler } from "../utils/async.handler.js";
import { ApiError } from "../utils/api-error.js";

import jwt from "jsonwebtoken";
import { User } from "./../models/user.models.js";
import { ProjectMember } from "./../models/projectmember.models.js";
import mongoose from "mongoose";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
    
  if (!token) {
    throw new ApiError(401, "Unauthorizer request");
  }
  try {
    const decode = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
    const user = await User.findById(decode?._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry -forgotPasswordToken -forgotPasswordTokenExpiry",
    );
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Authentication request failed");
  }
});

export const validateProjectPermission = (roles = []) =>
  asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    if (!projectId) {
      throw new ApiError(401, "ProjectId is missing");
    }
    // check user is part of project or not
    const projectDetails = await ProjectMember.findOne({
      project: projectId,
      user: req.user._id,
    });
    if (!projectDetails) {
      throw new ApiError(401, "Project not found or you are not a member");
    }
    // check user role
    const givenrole = projectDetails?.role;
    // add role details into req.user
    req.user.role = givenrole;

    if (!roles.includes(givenrole)) {
      throw new ApiError(403, "you don't have permission to procced");
    }
    next();
  });
