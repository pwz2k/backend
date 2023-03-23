"use strict";

const router = require("express").Router();
const Controller = require("../controllers/UserController");

// Authentication
router.get("/dashboard", Controller.dashboard);
router.post("/login", Controller.login);
router.get("/access", Controller.access);
router.post("/generateKey", Controller.generateApiKey);
router.post("/update-password", Controller.resetPassword);

module.exports = router;
