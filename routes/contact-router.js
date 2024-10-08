const express = require("express");
const router = express.Router();
const {
  createContact,
  getAllContact,
  getSingleContact,
  updateContact,
  deleteContact,
  getAllContactDefault,
  updateContactStatus,
} = require("../controller/contact-controller");
const auth = require("../middlewares/auth");

router.get("/", auth, getAllContact);
router.get("/default", auth, getAllContactDefault);
router.get("/:id", auth, getSingleContact);
router.post("/", createContact);
router.patch("/status", auth, updateContactStatus);
router.patch("/:id", auth, updateContact);
router.delete("/:id", auth, deleteContact);

module.exports = router;