"use strict";

const router = require("express").Router();
const Controller = require("../controllers/AdminController");
const multer = require("multer");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/new-barcodes/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// Authentication
router.post("/register", Controller.register);
router.post("/login", Controller.login);
router.post("/update-password", Controller.resetPassword);

// Worker
router.post("/create-worker", Controller.createAdminUser);
router.get("/read-workers", Controller.readWorkers);
router.post("/block/:id", Controller.blockWorker);

// barcodes
router.post(
  "/upload-barcodes",
  upload.single("barcode"),
  Controller.uploadBarcodes
);
router.get("/read-barcodes", Controller.readBarcodes);
router.post("/delete-barcodes", Controller.deleteBarcodes);
router.post("/delete-all-barcodes/:type", Controller.deleteAllBarcodes);

// dashboard
router.get("/dashboard", Controller.dashboard);
router.get("/access", Controller.access);
// router.get("/remove-duplicates", Controller.removeDuplicateBarcodes);
router.get("/read-average", Controller.readAverage);

// stats
router.get("/stats/read", Controller.readAllStats);
router.post("/stats/update", Controller.updateStats);

// user actions
router.post("/user/create", Controller.createUser);
router.post("/user/change-status", Controller.blockUnblockUser);
router.post("/user/update", Controller.updateUser);
router.post("/user/readAll", Controller.readAllUsers);
router.get("/user/readUsersSpending", Controller.readUsersSpending);

// admin ops on labels
router.post("/recycle-label", Controller.recycleLabel);
router.post("/ex-recycle-label", Controller.exRecycleLabel);
module.exports = router;
