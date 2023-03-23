"use strict";

const router = require("express").Router();
const Controller = require("../controllers/WebhookController");

// Authentication
router.post("/coinbase", Controller.coinbase);

module.exports = router;
