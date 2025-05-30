const router = require("express").Router();
const authRouter = require("./authrouters");
const entryRouter = require("./entryrouters");
const categoryRouter = require("./categoryrouters");
const transactionRouter = require("./transactionrouters");

router.use("/user", authRouter);
router.use("/entries", entryRouter);
router.use("/categories", categoryRouter);
router.use("/transactions", transactionRouter);

module.exports = router;
