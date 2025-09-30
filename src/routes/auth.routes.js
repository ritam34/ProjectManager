import { Router } from "express";
import { validate } from "../middlewares/validator.middlewares.js";
import {
  deleteAllUsers,
  getAllUsers,
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  resendVerificationEmail,
  refreshAccessToken,
  resetForgottenPassword,
  forgotPasswordRequest,
  changeCurrentPassword,
  getProfile,
} from "../controllers/auth.controllers.js";
import {
  userRegistrationValidator,
  userLoginValidator,
} from "../validators/validator.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router
  .route("/register")
  .post(userRegistrationValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/verify-email/:token").post(verifyEmail);
router.route("/resend-verification-email").post(resendVerificationEmail);
router.route("/refresh-access-token").post(refreshAccessToken); //need to look for do i have to verifyJWT here or not
router.route("/forgot-password").post(forgotPasswordRequest);
router.route("/reset-password/:token").post(resetForgottenPassword);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/profile").get(verifyJWT, getProfile);

// Admin routes
router.route("/users").get(getAllUsers).delete(deleteAllUsers);

export default router;
