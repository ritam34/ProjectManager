import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async.handler.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// need to delete later
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find();
  return res
    .status(200)
    .json(new ApiResponse(200, users, "All users fetched successfully"));
});

const deleteAllUsers = asyncHandler(async (req, res) => {
  await User.deleteMany();
  return res
    .status(200)
    .json(new ApiResponse(200, null, "All users deleted successfully"));
});

const registerUser = asyncHandler(async (req, res) => {
  try {
    const { email, password, username, fullname } = req.body;
    if (!email || !password || !username || !fullname) {
      throw new ApiError(400, "Provide user Creadintel");
    }
    const existingUser = await User.findOne({
      $or: [{ username: username }, { email: email }],
    });
    if (existingUser) {
      throw new ApiError(400, "User Already exist please log in");
    }
    const user = await User.create({
      username,
      email,
      fullname,
      password,
    });
    // generate access,emailverification,refreshtoken
    user.generateRefreshToken();
    const emailVerificationToken = user.generateEmailVerificationToken();
    // send verification email to user
    const savedUser = await user.save();
    if (!savedUser) {
      throw new ApiError(400, "Error while creating User Please try again");
    }
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_SMTP_HOST, // or SMTP
      port: process.env.MAIL_SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.MAIL_SMTP_USER,
        pass: process.env.MAIL_SMTP_PASSWORD,
      },
    });

    const verifyLink = `http://localhost:4000/api/v1/auth/verify/${emailVerificationToken}`;
    const mailOptions = {
      from: process.env.MAIL_SMTP_USER,
      to: user.email,
      subject: "Verify Your Email",
      text: `Click the link to verify your email: ${verifyLink}`,
      html: `<p>Please click <a href="${verifyLink}">here</a> to verify your email.</p>`,
    };

    // if want to send real mail after hosting
    // const emailSendResult = await transporter.sendMail(mailOptions, (error, info) => {
    //   if (error) {
    //     console.error("Error sending email:", error);
    //   } else {
    //     console.log("Email sent:", info.response);
    //   }
    // });

    const userToReturn = await User.findById(savedUser._id).select(
      "-password -refreshToken -emailVerificationTokenExpiry -forgotPasswordToken -forgotPasswordTokenExpiry",
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { userToReturn, verifyLink },
          "User created succesfully",
        ),
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      throw new ApiError(401, "provide credintial");
    }
    const user = await User.findOne({ email }).select(
      "-refreshToken -refreshTokenExpiry -emailVerificationToken -emailVerificationTokenExpiry -forgotPasswordToken -forgotPasswordTokenExpiry",
    );
    if (!user) {
      throw new ApiError(401, "Wrong Credintial");
    }
    const goodPasswordCheck = await user.isPasswordCorrect(password);
    if (!goodPasswordCheck) {
      throw new ApiError(401, "Wrong Credintial");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    await user.save({ validateBeforeSave: false });
    user.password = undefined;
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { user, accessToken, refreshToken },
          "User log in successful",
        ),
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req._id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      },
    );
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged Out"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

const verifyEmail = asyncHandler(async (req, res) => {
  const token = req.params.token;

  try {
    if (!token) {
      throw new ApiError(401, "Not a valid link");
    }
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiry: { $gt: Date.now() },
    });
    if (!user) {
      throw new ApiError(401, "Not a valid Token");
    }
    if (user.emailVerificationTokenExpiry < Date.now()) {
      user.emailVerificationTokenExpiry = undefined;
      user.emailVerificationToken = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(300).json(new ApiResponse(300, null, "Link exprired"));
    }
    user.isEmailVerified = true;
    user.emailVerificationTokenExpiry = undefined;
    user.emailVerificationToken = undefined;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Email verified succesfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(400, "Invalid email");
    }
    if (user.isEmailVerified) {
      return res
        .status(200)
        .json(new ApiResponse(200, null, "User Already verified"));
    }
    const emailVerificationToken = await user.generateEmailVerificationToken();
    console.log(emailVerificationToken);

    await user.save({ validateBeforeSave: false });
    // send mail here
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_SMTP_HOST, // or SMTP
      port: process.env.MAIL_SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.MAIL_SMTP_USER,
        pass: process.env.MAIL_SMTP_PASSWORD,
      },
    });

    const verifyLink = `http://localhost:4000/api/v1/auth/verify/${emailVerificationToken}`;
    const mailOptions = {
      from: process.env.MAIL_SMTP_USER,
      to: user.email,
      subject: "Verify Your Email",
      text: `Click the link to verify your email: ${verifyLink}`,
      html: `<p>Please click <a href="${verifyLink}">here</a> to verify your email.</p>`,
    };

    // if want to send real mail after hosting
    // const emailSendResult = await transporter.sendMail(mailOptions, (error, info) => {
    //   if (error) {
    //     console.error("Error sending email:", error);
    //   } else {
    //     console.log("Email sent:", info.response);
    //   }
    // });
    return res
      .status(200)
      .json(new ApiResponse(200, verifyLink, "Check your email"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

// have to read properly
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  try {
    if (!incomingRefreshToken) {
      throw new ApiError(401, "No refresh token present");
    }
    const decodedToken = await jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_TOKEN_SECRET,
    );
    if (!decodedToken) {
      throw new ApiError(401, "Invalid refresh token or token expired");
    }
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    // generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    await user.save({ validateBeforeSave: false });

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed",
        ),
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const email = req.body.email;
  try {
    if (!email) {
      throw new ApiError(400, "Email is required");
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, "Not a registered Email");
    }
    const token = await user.generateForgotPasswordToken();
    if (!token) {
      throw new ApiError(401, "token generation Failed");
    }
    await user.save({ validateBeforeSave: false });
    // send token via email"
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_SMTP_HOST, // or SMTP
      port: process.env.MAIL_SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.MAIL_SMTP_USER,
        pass: process.env.MAIL_SMTP_PASSWORD,
      },
    });

    const verifyLink = `http://localhost:4000/api/v1/auth/reset-password/${token}`;
    const mailOptions = {
      from: process.env.MAIL_SMTP_USER,
      to: user.email,
      subject: "Reset Your Password",
      text: `Click the link to reset Password: ${verifyLink}`,
      html: `<p>Please click <a href="${verifyLink}">here</a> to reset your password.</p>`,
    };

    // if want to send real mail after hosting
    // const emailSendResult = await transporter.sendMail(mailOptions, (error, info) => {
    //   if (error) {
    //     console.error("Error sending email:", error);
    //   } else {
    //     console.log("Email sent:", info.response);
    //   }
    // });
    return res
      .status(200)
      .json(new ApiResponse(200, verifyLink, "Check your registered Email"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

const resetForgottenPassword = asyncHandler(async (req, res) => {
  const token = req.params.token;
  const newPassword = req.body.password;
  try {
    if (!token) {
      throw new ApiError(401, "Not a valid link");
    }
    if (!newPassword) {
      throw new ApiError(401, "Provide a new password");
    }
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordTokenExpiry: { $gt: Date.now() },
    });
    if (!user) {
      throw new ApiError(401, "Invalid Token");
    }
    if (user.forgotPasswordTokenExpiry < Date.now()) {
      user.forgotPasswordToken = undefined;
      user.forgotPasswordTokenExpiry = undefined;
      await user.save();
      return res.status(300).json(new ApiResponse(300, null, "Link expired"));
    }
    user.password = newPassword;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordTokenExpiry = undefined;
    await user.save();
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password reset successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const newPassword = req.body.password;
  try {
    if (!newPassword) {
      throw new ApiError(401, "Provide a new password");
    }

    const user = await User.findOne({ _id: req.user._id });
    if (!user) {
      throw new ApiError(401, "User not Found");
    }
    user.password = newPassword;
    const updatedUser = await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "Password changed successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});

const getProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id }).select(
      "-password -refreshToken -refreshTokenExpiry -emailVerificationToken -emailVerificationTokenExpiry -forgotPasswordToken -forgotPasswordTokenExpiry",
    );
    if (!user) {
      throw new ApiError(401, "User not Found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, user, "User profile fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server Error");
  }
});
export {
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
};
