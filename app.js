import express from "express";
import authRouter from "./src/routes/auth.routes.js";
import accountRouter from "./src/routes/account.routes.js";
import cookieParser from "cookie-parser";
import transactionRoutes from "./src/routes/transaction.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Ledger Service is up and running");
});
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transaction", transactionRoutes);

export default app;
