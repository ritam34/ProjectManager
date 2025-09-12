import { body } from "express-validator";

const userRegistrationValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is not valid"),
    body("username")
      .trim()
      .toLowerCase()
      .notEmpty()
      .withMessage("Username is required")
      .isLength({ min: 4 })
      .withMessage("username should be atleast 4 character")
      .isLength({ max: 12 })
      .withMessage("username cannot exceed 12 character"),
    body("password")
      .notEmpty()
      .withMessage("password is required")
      .isLength({ min: 8 })
      .withMessage("password should be atleast 8 character")
      .isLength({ max: 30 })
      .withMessage("password cannot exceed 30 character"),
    body("fullname")
      .notEmpty()
      .withMessage("fullname is required")
      .isLength({ max: 30 })
      .withMessage("password cannot exceed 30 character"),
  ];
};

const userLoginValidator = () => {
  return [
    // user can login with email or username
    // Custom check for email OR username
    body().custom((value, { req }) => {
      if (!req.body.email && !req.body.username) {
        throw new Error("Email or Username is required");
      }
      return true;
    }),
    body("password").notEmpty().withMessage("password is required"),
  ];
};

export { userRegistrationValidator, userLoginValidator };
