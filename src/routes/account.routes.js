import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
	createAccountController,
	getUserAccountController,
	getAccountBalanceController,
} from "../controllers/account.controller.js";

const router = express.Router();

router.post("/", authMiddleware, createAccountController);

router.get("/", authMiddleware, getUserAccountController);
router.get("/:accountId/balance", authMiddleware, getAccountBalanceController);

export default router;