import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: {
        url: String,
        localpath: String,
      },
      default: {
        url: "https://placehold.jp/3e80b1/ffffff/300x300.png?text=IMAGE",
        localpath: "",
      },
    },
    fullname: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationTokenExpiry: {
      type: Date,
      default: null,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    forgotPasswordToken: {
      type: String,
      default: null,
    },
    forgotPasswordTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// hooks
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// methods
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  // store hashed token in db for security

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.emailVerificationTokenExpiry = Date.now() + 10 * 60 * 1000;
  return token;
};

userSchema.methods.generateForgotPasswordToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  // store hashed token in db for security
  this.forgotPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
  this.forgotPasswordTokenExpiry = Date.now() + 10 * 60 * 1000;
  return token;
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, username: this.username, email: this.email },
    process.env.JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN },
  );
};

userSchema.methods.generateRefreshToken = function () {
  const token = jwt.sign(
    { _id: this._id },
    process.env.JWT_REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
    },
  );
  this.refreshToken = token;
  return token;
};

export const User = mongoose.model("User", userSchema);
