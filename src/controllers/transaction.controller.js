import mongoose from "mongoose";
import Transaction from "../models/transaction.models.js";
import Ledger from "../models/ledger.model.js";
import Account from "../models/account.model.js";
import { sendTransactionEmail } from "../services/email.service.js";

async function createTransaction(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;
  const transactionAmount = Number(amount);

  if (
    !fromAccount ||
    !toAccount ||
    !idempotencyKey ||
    !Number.isFinite(transactionAmount) ||
    transactionAmount <= 0
  ) {
    return res.status(400).json({
      message:
        "Valid fromAccount, toAccount, positive amount, and idempotencyKey are required",
    });
  }

  if (
    !mongoose.isValidObjectId(fromAccount) ||
    !mongoose.isValidObjectId(toAccount)
  ) {
    return res.status(400).json({ message: "Invalid account ID" });
  }

  if (fromAccount === toAccount) {
    return res
      .status(400)
      .json({ message: "Source and destination accounts must differ" });
  }

  const existingTransaction = await Transaction.findOne({ idempotencyKey });
  if (existingTransaction) {
    return res
      .status(existingTransaction.status === "COMPLETED" ? 200 : 409)
      .json({
        message: `Transaction is ${existingTransaction.status.toLowerCase()}`,
        transaction: existingTransaction,
      });
  }

  const [fromUserAccount, toUserAccount] = await Promise.all([
    Account.findById(fromAccount),
    Account.findById(toAccount),
  ]);

  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({
      message: "Invalid fromAccount or toAccount",
    });
  }

  if (fromUserAccount.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "You cannot debit this account" });
  }

  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      message:
        "Both fromAccount and toAccount must be Active to process transaction",
    });
  }

  const balance = await fromUserAccount.getBalance();

  if (balance < transactionAmount) {
    return res.status(400).json({
      message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${transactionAmount}`,
    });
  }

  const session = await mongoose.startSession();
  let transaction;

  try {
    await session.withTransaction(async () => {
      transaction = new Transaction({
        fromAccount,
        toAccount,
        amount: transactionAmount,
        idempotencyKey,
        status: "PENDING",
      });
      await transaction.save({ session });

      await Ledger.create(
        [
          {
            account: fromAccount,
            amount: transactionAmount,
            transaction: transaction._id,
            type: "DEBIT",
          },
          {
            account: toAccount,
            amount: transactionAmount,
            transaction: transaction._id,
            type: "CREDIT",
          },
        ],
        { session },
      );

      transaction.status = "COMPLETED";
      await transaction.save({ session });
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Idempotency key has already been used" });
    }
    return res.status(500).json({ message: "Transaction failed" });
  } finally {
    await session.endSession();
  }

  try {
    await sendTransactionEmail(
      req.user.email,
      req.user.name,
      transactionAmount,
      toAccount,
    );
  } catch (error) {
    console.error("Transaction email failed:", error.message);
  }

  return res.status(200).json({
    message: "Transaction processed successfully",
    transaction,
  });
}

async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;
  const transactionAmount = Number(amount);

  if (
    !toAccount ||
    !idempotencyKey ||
    !Number.isFinite(transactionAmount) ||
    transactionAmount <= 0
  ) {
    return res.status(400).json({
      message: "toAccount, a positive amount, and idempotencyKey are required",
    });
  }

  if (!mongoose.isValidObjectId(toAccount)) {
    return res.status(400).json({ message: "Invalid account ID" });
  }

  const existingTransaction = await Transaction.findOne({ idempotencyKey });
  if (existingTransaction) {
    return res
      .status(existingTransaction.status === "COMPLETED" ? 200 : 409)
      .json({
        message: `Transaction is ${existingTransaction.status.toLowerCase()}`,
        transaction: existingTransaction,
      });
  }

  const [toUserAccount, fromUserAccount] = await Promise.all([
    Account.findById(toAccount),
    Account.findOne({ user: req.user._id }),
  ]);

  if (!toUserAccount || !fromUserAccount) {
    return res
      .status(404)
      .json({ message: "Destination or system account not found" });
  }

  if (
    toUserAccount.status !== "ACTIVE" ||
    fromUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({ message: "Both accounts must be active" });
  }

  if (toUserAccount._id.equals(fromUserAccount._id)) {
    return res
      .status(400)
      .json({ message: "Source and destination accounts must differ" });
  }

  const balance = await fromUserAccount.getBalance();
  if (balance < transactionAmount) {
    return res
      .status(400)
      .json({ message: "System account has insufficient balance" });
  }

  const session = await mongoose.startSession();
  let transaction;

  try {
    await session.withTransaction(async () => {
      transaction = new Transaction({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount: transactionAmount,
        idempotencyKey,
        status: "PENDING",
      });
      await transaction.save({ session });

      await Ledger.create(
        [
          {
            account: fromUserAccount._id,
            amount: transactionAmount,
            transaction: transaction._id,
            type: "DEBIT",
          },
          {
            account: toAccount,
            amount: transactionAmount,
            transaction: transaction._id,
            type: "CREDIT",
          },
        ],
        { session },
      );

      transaction.status = "COMPLETED";
      await transaction.save({ session });
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Idempotency key has already been used" });
    }
    return res
      .status(500)
      .json({ message: "Initial funds transaction failed" });
  } finally {
    await session.endSession();
  }

  return res.status(201).json({
    message: "Initial funds transaction completed successfully",
    transaction,
  });
}

export { createTransaction, createInitialFundsTransaction };
