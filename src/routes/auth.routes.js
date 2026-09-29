import express from "express";
import {
  userRegisterController,
  userLoginController,
  userLogoutController,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", userRegisterController);
router.post("/login", userLoginController);

router.post("/", userLogoutController);

export default router;