const express = require("express");
const router = express.Router();
const EntryController = require("../controllers/EntryController");
const authenticate = require("../middlewares/authenticate");

router.use(authenticate);
router.post("/", EntryController.create);
router.get("/", EntryController.findAll);
router.put("/:id", EntryController.update);
router.delete("/:id", EntryController.delete);

module.exports = router;
