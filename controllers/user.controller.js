import AppError from "../utils/appError.js";
import User from "../models/user.model.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";
import sendEmail from "../utils/sendMail.js";
import crypto from "crypto";

const cookieOptions = {
  secure: true,
  maxAge: 7 * 24 * 60 * 60 * 1000, //7days
  httpOnly: true,
};

const register = async (req, res, next) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return next(new AppError("All field are required", 400));
  }

  const userExist = await User.findOne({ email });

  if (userExist) {
    return next(new AppError("User Already Exist", 400));
  }

  const user = await User.create({
    fullName,
    email,
    password,
    avatar: {
      public_id: email,
      secure_url:
        "https://plus.unsplash.com/premium_photo-1720004021036-44ff682b69b0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fHNwbGFzaHxlbnwwfHwwfHx8MA%3D%3D",
    },
  });

  if (!user) {
    return next(new AppError("User Registeration Failed", 400));
  }

  // TODO : upload user picture

  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
        width: 250,
        height: 250,
        gravity: "faces",
        crop: "fill",
      });

      if (result) {
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;
      }

      //once upload the file in cloud than remove from local machine
      fs.rm(`uploads/${req.file.filename}`);
    } catch (e) {
      return next(
        new AppError(e.message || "File not upload,please try agian", 500)
      );
    }
  }

  await user.save();

  // TOKEN
  const token = await user.generateJWTToken();
  res.cookie("token", token, cookieOptions);

  user.password = undefined;

  return res.status(200).json({
    success: true,
    message: "User Register Successfully..",
    user,
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and password are required"));
  }

  const user = await User.findOne({
    email,
  }).select("password");

  if (!user || !user.comparePassword(password)) {
    return next(new AppError("Email or password do not matched"));
  }

  const token = await user.generateJWTToken();
  user.password = undefined;

  res.cookie("token", token, cookieOptions);

  res.status(201).json({
    status: true,
    message: "User Login Successfully",
    user,
  });
};

const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    message: "User Details",
    user,
  });
};

const logout = async (req, res) => {
  res.cookie("token", null, {
    secure: true,
    maxAge: 0,
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "User Logout Successfully",
  });
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("User not Found", 400));
  }

  const resetToken = await user.generatePasswordTokon();

  await user.save();

  // TODO send mail
  const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const subject = "Reset Password";
  const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;

  try {
    await sendEmail(email, message, subject);

    res.status(200).json({
      success: true,
      message: `Reset password token has been sent to ${email} successfully`,
    });
  } catch (e) {
    // If some error happened we need to clear the forgotPassword* fields in our DB
    user.forgotPasswordExpire = undefined;
    user.forgotPasswordToken = undefined;

    await user.save();
    return next(
      new AppError(
        e.message || "Something went wrong, please try again.",
        500
      )
    );
  }
};

const resetPassword = async (req, res, next) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  const forgotPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Check if password is not there then send response saying password is required
  if (!password) {
    return next(new AppError("Password is required", 400));
  }

  console.log(forgotPasswordToken);

  const user = await User.findOne({
    forgotPasswordToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new AppError("Token is invalid or expired, please try again", 400)
    );
  }

  user.password = password;

  user.forgotPasswordExpiry = undefined;
  user.forgotPasswordToken = undefined;

  await user.save();
  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
};

const changePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.user;

  if (!oldPassword || !newPassword) {
    return next(
      new AppError("Old password and new password are required", 400)
    );
  }

  const user = await User.findById(id).select("+password");

  if (!user) {
    return next(new AppError("Invalid user id or user does not exist", 400));
  }

  const isPasswordValid = await user.comparePassword(oldPassword);

  if (!isPasswordValid) {
    return next(new AppError("Invalid old password", 400));
  }

  // Setting the new password
  user.password = newPassword;
  // Save the data in DB
  await user.save();

  // Setting the password undefined so that it won't get sent in the response
  user.password = undefined;

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
};

const updateUser = async () => {
  const { fullName } = req.body;
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return next(new AppError("Invalid user id or user does not exist"));
  }

  if (fullName) {
    user.fullName = fullName;
  }

  if (req.file) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
        width: 250,
        height: 250,
        gravity: "faces",
        crop: "fill",
      });

      if (result) {
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;
      }

      //once upload the file in cloud than remove from local machine
      fs.rm(`uploads/${req.file.filename}`);
    } catch (error) {
      return next(
        new AppError(error || "File not uploaded, please try again", 400)
      );
    }
  }
};

export {
  register,
  login,
  getProfile,
  logout,
  forgotPassword,
  resetPassword,
  updateUser,
  changePassword
};
