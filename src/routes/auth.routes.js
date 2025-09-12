import { Router } from "express";
import { validate } from "../middlewares/validator.middlewares.js";
import {
  registerUser,
  getAllUsers,
  deleteAllUsers,
  loginUser,
  logoutUser,
  verifyEmail,
  refreshAccessToken,
  forgotPasswordRequest,
  changeCurrentPassword,
  resetForgottenPassword,
  getProfile,
} from "../controllers/auth.controllers.js";
import {
  userRegistrationValidator,
  userLoginValidator,
} from "../validators/validator.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.post("/register", userRegistrationValidator(), validate, registerUser);
router.post("/login", userLoginValidator(), validate, loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.post("/verify/:token", verifyEmail);//http://localhost:4000/api/v1/auth/verify/844cb44704489c54cbc1d5fd37a2390a208dfabe74bf3bb6b41ec17ce9f3926a
router.post("/refresh-accesstoken", verifyJWT, refreshAccessToken);
router.post("/changepassword", verifyJWT, changeCurrentPassword);
router.post("/forgotpassword", forgotPasswordRequest);
router.post("/resetpassword/:token", resetForgottenPassword);
router.get("/profile", verifyJWT, getProfile);

// need to delete later
// router.get("/users", getAllUsers);
// router.delete("/users", deleteAllUsers);

export default router;
