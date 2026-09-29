import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Blacklist from "../models/blacklist.model.js";
async function authMiddleware(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized access, token is missing",
    });
  }

  const isBlacklisted = await Blacklist.findOne({ token });

  if (isBlacklisted) {
    return res.status(401).json({
      message: "Unauthorized access,token is invalid",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized access, user not found",
      });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized access, token is invalid",
    });
  }
}

async function authSystemUserMiddleware(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unotherized access,token is missing",
    });
  }

  const isBlacklisted = await Blacklist.findOne({ token });

  if (isBlacklisted) {
    return res.status(401).json({
      message: "Unauthorized access,token is invalid",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("+systemUser");

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized access, user not found",
      });
    }

    if (!user.systemUser) {
      return res.status(403).json({
        message: "Forbidden access,not a system user",
      });
    }
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({
      message: "Unthorized access,token is invalid",
    });
  }
}

export { authMiddleware, authSystemUserMiddleware };
