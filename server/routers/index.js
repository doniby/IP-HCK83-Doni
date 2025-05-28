const router = require("express").Router();
const authRouter = require("./authrouters");
const entryRouter = require("./entryrouters");
const categoryRouter = require("./categoryrouters");

router.use("/user", authRouter);
router.use("/entries", entryRouter);
router.use("/categories", categoryRouter);

module.exports = router;
