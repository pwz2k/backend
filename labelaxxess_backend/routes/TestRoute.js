"use strict";

const router = require("express").Router();
const Controller = require("../controllers/TestController");

// Authentication
router.get("/generateBarcode", Controller.gs1Barcode);

module.exports = router;
