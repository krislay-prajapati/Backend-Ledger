import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendRegistrationEmail } from "../services/email.service.js";
import Blacklist from "../models/blacklist.model.js";

async function userRegisterController(req, res) {
  const { email, password, name } = req.body;

  const isExists = await User.findOne({ email: email });

  if (isExists) {
    return res.status(422).json({
      message: "User already exists with email.",
      status: "failed",
    });
  }

  const user = await User.create({ email, password, name });

  try {
    await sendRegistrationEmail(user.email, user.name);
  } catch (error) {
    console.log("Registration email failed:", error.message);
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("token", token);

  return res.status(201).json({
    _id: user._id,
    email: user.email,
    name: user.name,
    token,
  });
}

async function userLoginController(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({
      message: "Email or Password is INVALID",
    });
  }

  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    return res.status(401).json({
      message: "Email or Password is INVALID",
    });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("token", token);

  return res.status(200).json({
    _id: user._id,
    email: user.email,
    name: user.name,
    token,
  });
}

async function userLogoutController(req, res) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(200).json({
      message: "User logged out seccessfully",
    });
  }

  res.clearCookie("token");
  await Blacklist.create({ token });

  return res.status(200).json({
    message: "User logged out successfully",
  });
}

export { userRegisterController, userLoginController, userLogoutController };
