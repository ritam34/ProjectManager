import { Router } from "express";
import {
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
} from "../controllers/task.controllers.js";
import { AvailableUserRoles ,UserRolesEnum} from "../utils/constants.js";
import {verifyJWT,validateProjectPermission} from "../middlewares/auth.middlewares.js"


const router = Router();

router
  .route("/:projectId")
  .get(verifyJWT, validateProjectPermission(AvailableUserRoles), getTasks)
  .post(verifyJWT, validateProjectPermission([UserRolesEnum.ADMIN,UserRolesEnum.PROJECT_ADMIN]), createTask);
router
  .route("/:taskId")
  .get(verifyJWT, validateProjectPermission(AvailableUserRoles), getTaskById)
  .put(verifyJWT, validateProjectPermission([UserRolesEnum.ADMIN,UserRolesEnum.PROJECT_ADMIN]), updateTask)
  .delete(verifyJWT, validateProjectPermission([UserRolesEnum.ADMIN,UserRolesEnum.PROJECT_ADMIN]), deleteTask);
router
  .route("/:taskId/subtasks")
  .get(verifyJWT, validateProjectPermission(AvailableUserRoles), getSubTasks)
  .post(
    verifyJWT,
    validateProjectPermission(AvailableUserRoles),
    createSubTask,
  );
router
  .route("/:taskId/subtasks/:subtaskId")
  .get(verifyJWT, validateProjectPermission(AvailableUserRoles), getSubTaskById)
  .put(verifyJWT, validateProjectPermission(AvailableUserRoles), updateSubTask)
  .delete(
    verifyJWT,
    validateProjectPermission(AvailableUserRoles),
    deleteSubTask,
  );

export default router;
