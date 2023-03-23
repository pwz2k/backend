"use strict";

const router = require("express").Router();
const Controller = require("../controllers/UspsController");

// Authentication
router.post("/address", Controller.validateAddress);
router.post("/zipcode", Controller.zipCodeLookup);
router.post("/city-state", Controller.cityStateLookup);

module.exports = router;
