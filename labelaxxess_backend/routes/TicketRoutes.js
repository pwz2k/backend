"use strict";

const router = require("express").Router();
const Controller = require("../controllers/TicketController");

// Authentication
router.post("/create", Controller.createTicket);
router.post("/read", Controller.readTickets);
router.get("/read/:id", Controller.getTicket);
router.post("/reply", Controller.sendMessage);
router.post("/close/:id", Controller.closeTicket);
router.post("/open/:id", Controller.openTicket);

module.exports = router;
