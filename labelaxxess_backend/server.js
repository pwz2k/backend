require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { Sequelize } = require("sequelize");
const cron = require("node-cron");
const cluster = require("cluster");
const numberOfCores = require("os").cpus().length;

// GLOBAL VARIABLES
env = module.exports = process.env;
helpers = module.exports = require("./utils/Helper");
messages = module.exports = require("./utils/Message");
constants = module.exports = require("./utils/Constant");
payments = module.exports = require("./utils/Payment");
Op = module.exports = Sequelize.Op;
rootDir = module.exports = __dirname;
axios = module.exports = require("axios");
fs = module.exports = require("fs");
moment = module.exports = require("moment");

// set cors
app.use(cors());
app.use(express.json());

// DB CONNECTION
// DB = new Sequelize("sqlite::memory:", { logging: false });
// DB = new Sequelize({
//   dialect: "sqlite",
//   storage: "./db/db.sqlite",
// });

DB = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  dialect: env.DB_DIALECT,
  port: env.DB_PORT,
  logging: false,
});

// DB.sync({ force: true })
DB.sync({
  // alter: true,
})
  .then(() => {
    return DB.authenticate();
  })
  .then(() => {
    console.info("Proxy DB Connection has been established successfully.");
  })
  .catch((err) => {
    console.log("Unable to connect with DB", err);
  });

// check if the current
// process is the
// master process
if (cluster.isMaster) {
  // if the current process
  // is the master process
  // make child process
  // for (let i = 0; i < 1; i++) {
  for (let i = 0; i < numberOfCores; i++) {
    if (env.DEBUG_MODE === "off") {
      console.log = function () {};
      console.error = function () {};
    }
    // fork child process
    cluster.fork();
    process.env.NODE_APP_INSTANCE = i;
    console.log("Forked process", process.env.NODE_APP_INSTANCE);
  }
  cron.schedule("*/5 * * * *", () => {
    console.log("cron job running");
    // update label status
    require("./controllers/CronController").updateLabelStatus();
    require("./controllers/CronController").checkBarcodes();
  });
} else {
  // route implementation
  // app.use("/api/test/", require("./routes/TestRoute"));
  app.use("/api/webhook/", require("./routes/WebhookRoute"));
  app.use("/api/balance/", require("./routes/BalanceRoute"));
  app.use("/api/pricing/", require("./routes/PricingRoute"));
  app.use("/api/ticket/", require("./routes/TicketRoutes"));
  app.use("/api/user/", require("./routes/UserRoute"));
  app.use("/api/usps/", require("./routes/UspsRoute"));
  app.use("/api/admin/", require("./routes/AdminRoute"));
  app.use("/api/label/", require("./routes/LabelRoute"));

  app.use((req, res) => {
    // Download files
    if (req.path.includes("labels")) {
      return res.download("." + decodeURIComponent(req.path));
    }

    // console.log(req);
    return res.send(404).json({
      message: "Not Found",
    });
  });
  app.listen(env.PORT, () => {
    console.log(
      `Label app listening on port ${env.PORT} ${process.env.NODE_APP_INSTANCE}`
    );

    console.info("👉 Debug mode => " + env.DEBUG_MODE);
  });
}

if (global?.gc) {
  global.gc();
} else {
  console.log(
    "Garbage collection unavailable.  use --expose-gc " +
      "when launching node to enable forced garbage collection."
  );
}

// require("./controllers/CronController").fixbarcodeProblem();
