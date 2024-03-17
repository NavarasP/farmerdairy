const express = require("express");
const farmerController = require("../controllers/farmerController");
const authorize = require("../middlewares/authorize");

const router = express.Router();

router.post("/farm/create", authorize, farmerController.createFarmData);
router.get("/farms", authorize, farmerController.listFarms);
router.get("/reports/:id", authorize, farmerController.listFarmReports);
router.get("/transaction", authorize, farmerController.listTransactions);

router.post("/report/:farmId", authorize, farmerController.createFarmReport);
router.get("/chatusers", authorize, farmerController.fetchCoFarmersAndAgent);

module.exports = router;
