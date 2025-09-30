import { Router } from "express";
import {
  getAllProject,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMemberToProject,
  getProjectMembers,
  updateMemberRole,
  deleteMember,
} from "../controllers/project.controllers.js";
import {
  verifyJWT,
  validateProjectPermission,
} from "../middlewares/auth.middlewares.js";
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";

const router = Router();

router
  .route("/")
  .get(verifyJWT, getAllProject)
  .post(verifyJWT,createProject);
router
  .route("/:projectId")
  .get(verifyJWT, validateProjectPermission(AvailableUserRoles), getProjectById)
  .put(verifyJWT, validateProjectPermission(AvailableUserRoles), updateProject)
  .delete(verifyJWT, validateProjectPermission(AvailableUserRoles), deleteProject);
router
  .route("/:projectId/members")
  .get(verifyJWT, validateProjectPermission(AvailableUserRoles), getProjectMembers)
  .post(verifyJWT, validateProjectPermission(AvailableUserRoles), addMemberToProject);
router
  .route("/:projectId/members/:userId")
  .put(verifyJWT, validateProjectPermission(AvailableUserRoles), updateMemberRole)
  .delete(verifyJWT, validateProjectPermission(AvailableUserRoles), deleteMember);

export default router;
