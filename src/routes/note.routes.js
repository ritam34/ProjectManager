import { Router } from "express";
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";
import {
  validateProjectPermission,
  verifyJWT,
} from "../middlewares/auth.middlewares.js";
import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
} from "../controllers/note.controllers.js";

const router = Router();

router
  .route("/:projectId")
  .get(
    verifyJWT,
    validateProjectPermission(AvailableUserRoles),
    getNotes,
  )
  .post(
    verifyJWT,
    validateProjectPermission([UserRolesEnum.ADMIN]),
    createNote,
  );
router
  .route("/:noteId")
  .get(verifyJWT, validateProjectPermission(AvailableUserRoles), getNoteById)
  .put(verifyJWT, validateProjectPermission([UserRolesEnum.ADMIN]), updateNote)
  .delete(
    verifyJWT,
    validateProjectPermission([UserRolesEnum.ADMIN]),
    deleteNote,
  );
export default router;
