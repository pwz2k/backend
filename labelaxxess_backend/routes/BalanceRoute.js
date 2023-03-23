"use strict";

const router = require("express").Router();
const Controller = require("../controllers/BalanceController");

// Authentication
router.post("/create", Controller.create);
router.post("/read", Controller.read);

module.exports = router;
