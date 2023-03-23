"use strict";

const router = require("express").Router();
const Controller = require("../controllers/PricingController");

// admin
router.post("/create", Controller.createPricing);
router.get("/read", Controller.readPricing);
router.put("/update", Controller.updatePricing);
router.delete("/delete/:id", Controller.deletePricing);

// user
router.post("/user/create", Controller.createUserPricing);
router.get("/read/:userId", Controller.getUserPricing);
router.put("/user/update", Controller.updateUserPricing);
router.delete("/user/delete/:id", Controller.deleteUserPricing);

module.exports = router;
