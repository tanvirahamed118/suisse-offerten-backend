const express = require("express");
const router = express.Router();
const {
  createMembershipPayment,
  getAllPayment,
  getSinglePayment,
  deletePayment,
  createCreditsPayment,
  getAllTransactions,
  updatePaymentMembershipStatus,
  updatePaymentCredit,
  createMembershipTransaction,
  createCreditTransaction,
} = require("../controller/payment-controller");
const auth = require("../middlewares/auth");

router.get("/transaction", auth, getAllTransactions);
router.get("/", auth, getAllPayment);
router.get("/:id", auth, getSinglePayment);
router.post("/credit", createCreditsPayment);
router.post("/:id", createMembershipPayment);
router.post("/:id", deletePayment);
router.post("/create/transaction/credits", createCreditTransaction);
router.post("/create/transaction", createMembershipTransaction);
router.patch("/membership", auth, updatePaymentMembershipStatus);
router.patch("/credit", auth, updatePaymentCredit);

module.exports = router;
