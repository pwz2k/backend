"use strict";

const router = require("express").Router();
const Controller = require("../controllers/LabelController");
// const rateLimit = require("express-rate-limit");
// const limiter = rateLimit({
//   windowMs: 3000,
//   max: 1,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: "Too many requests from this IP, please try again after 3 seconds",
// });

// Authentication
router.post("/generate", Controller.create);
router.get("/read", Controller.readAll);
router.get("/read/:id", Controller.read);
router.get("/fix-barcodes", Controller.fixBarcodeProblem);

module.exports = router;
