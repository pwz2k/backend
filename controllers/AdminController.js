"use strict";
const AdminUser = require("../models/AdminModel");
const StatsModel = require("../models/StatsModel");
const BarCode = require("../models/BarCode");
const Label = require("../models/Label");
const User = require("../models/User");

var month = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
let days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

async function getAdmin(req) {
  const { authorization } = req.headers;
  if (!authorization) return false;
  const adminId = await helpers.verifyToken(authorization);
  if (!adminId) return false;
  const admin = await AdminUser.findOne({ where: { id: adminId } });
  if (!admin) return false;
  return admin;
}

module.exports = {
  // Dashboard
  dashboard: async (req, res) => {
    try {
      const date = new Date();
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);

      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const admin = await AdminUser.findOne({
        where: {
          id: adminId,
          type: "admin",
        },
      });

      // check if admin exists
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Admin"),
          {}
        );
      }

      // total workers
      const totalWorkers = await AdminUser.count({
        where: {
          type: "worker",
        },
      });

      // total barcodes
      const barcodes = await BarCode.count({
        where: {
          used: false,
          status: "good",
        },
      });

      // total labels
      const labels = await Label.count();

      // label chart data
      let labelStats = [];
      const filter = req.query.filter;
      const counter = filter === "t" ? 2 : filter === "w" ? 7 : 30;

      if (filter === "y") {
        var monthNum;
        for (var i = 0; i < 12; i++) {
          monthNum = date.getMonth();
          if (monthNum - i < 0) {
            fromDate = date.getFullYear() - 1;
            monthNum = 12 - Math.abs(monthNum - i);
          } else {
            monthNum -= i;
          }

          // get label month vise
          const labelMonth = await Label.count({
            where: {
              createdAt: {
                [Op.between]: [
                  moment(
                    new Date(date.getFullYear(), date.getMonth(), 0, 0, 0, 0)
                  )
                    .add(-i, "month")
                    .endOf("month")
                    .format("YYYY-MM-DD"),
                  moment(
                    new Date(date.getFullYear(), date.getMonth(), 0, 0, 0, 0)
                  )
                    .add(-i + 1, "month")
                    .format("YYYY-MM-DD"),
                ],
              },
            },
          });

          labelStats.push({
            label: month[monthNum],
            count: labelMonth,
          });
        }
      } else {
        for (let i = 0; i < counter; i++) {
          let fromDate = new Date(date);
          let toDate = new Date(date);

          // minus i days from current date
          fromDate.setDate(fromDate.getDate() - i);
          toDate.setDate(toDate.getDate() - i + 1);

          fromDate = fromDate.toISOString().split("T")[0];
          toDate = toDate.toISOString().split("T")[0];

          let labelCount = await Label.count({
            where: {
              createdAt: {
                [Op.between]: [fromDate, toDate],
              },
            },
          });

          labelStats.push({
            label: fromDate,
            count: labelCount,
          });
        }
      }

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Admin", "Barcodes Read"),
        {
          stats: {
            totalWorkers,
            barcodes,
            labels,
          },
          chart: labelStats,
        }
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  // read average
  readAverage: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);

      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      var last14DaysStats = [];
      for (let i = 0; i < 15; i++) {
        let fromDate = new Date(date);
        let toDate = new Date(date);

        // minus i days from current date
        fromDate.setDate(fromDate.getDate() - i - 1);
        toDate.setDate(toDate.getDate() - i);

        fromDate = fromDate.toISOString().split("T")[0];
        toDate = toDate.toISOString().split("T")[0];

        let labels = await Label.findAll({
          where: {
            createdAt: {
              [Op.between]: [fromDate, toDate],
            },
          },
        });

        last14DaysStats.push({
          priority: labels.filter((label) => label.type === "priority").length,
          express: labels.filter((label) => label.type === "express").length,
          firstclass: labels.filter((label) => label.type === "firstclass")
            .length,
          signature: labels.filter((label) => label.type === "signature")
            .length,
        });
      }

      // get average by type from last14DaysStats
      var priority = 0;
      var express = 0;
      var firstclass = 0;
      var signature = 0;
      last14DaysStats.forEach((stat) => {
        priority += stat.priority;
        express += stat.express;
        firstclass += stat.firstclass;
        signature += stat.signature;
      });

      priority = priority / 14;
      express = express / 14;
      firstclass = firstclass / 14;
      signature = signature / 14;

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Admin", "Barcodes Read"),
        {
          priority,
          express,
          firstclass,
          signature,
        }
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  // check access
  access: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);

      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const admin = await AdminUser.findOne({
        where: {
          id: adminId,
        },
      });

      // check if admin exists
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Admin"),
          {}
        );
      }

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Admin", "Barcodes Read"),
        {
          superAccess: admin.type === "admin" ? true : false,
        }
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  // Test Registration
  register: async (req, res) => {
    try {
      console.log(req.body);
      const { username, email, password, type } = req.body;

      // check if email or username already exists
      const check = await AdminUser.findOne({
        where: {
          [Op.or]: [{ username }, { email }],
        },
      });
      if (check) {
        return helpers.createResponse(
          res,
          constants.UNPROCESSED,
          messages.MODULE_ALREADY_EXIST("Account"),
          {}
        );
      }

      const user = await AdminUser.create({
        username,
        email,
        password: await helpers.encrypt(password),
        type,
      });
      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Admin", "Registered"),
        {
          token: await helpers.generateToken(
            {
              id: user.id,
            },
            true
          ),
        }
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  // Admin Login
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      // const response = await helpers.verifyRecaptcha(req);
      // if (!response)
      //   return helpers.createResponse(
      //     res,
      //     constants.UNPROCESSED,
      //     messages.INVLAID_RECAPTHA,
      //     {}
      //   );
      const admin = await AdminUser.findOne({
        where: {
          username,
          password: await helpers.encrypt(password),
          isActive: true,
        },
      });

      if (!admin) {
        return res.status(400).json({
          message: "Invalid username or password",
        });
      }
      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.LOGIN_SUCCESS,
        {
          token: await helpers.generateToken(admin.id),
        }
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  // Reset password
  resetPassword: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);

      console.log(adminId);

      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const { password } = req.body;
      const admin = await AdminUser.findOne({
        where: {
          id: adminId,
        },
      });

      console.log(admin);

      // check if admin exists
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Admin"),
          {}
        );
      }

      // Update password
      await admin.update({
        password: await helpers.encrypt(password),
      });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Admin", "Password Reset"),
        {}
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  // Create Admin User (worker)
  createAdminUser: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);
      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const admin = await AdminUser.findOne({
        where: {
          id: adminId,
          type: "admin",
        },
      });

      // check if admin exists
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Admin"),
          {}
        );
      }

      const { username, email, password } = req.body;

      // check if email or username already exists
      const check = await AdminUser.findOne({
        where: {
          [Op.or]: [{ username }, { email }],
        },
      });

      if (check) {
        return helpers.createResponse(
          res,
          constants.UNPROCESSED,
          messages.MODULE_ALREADY_EXIST("Account"),
          {}
        );
      }

      // Create Admin User
      await AdminUser.create({
        username,
        email,
        password: await helpers.encrypt(password),
        type: "worker",
      });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Worker", "Created"),
        {}
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  // Read All Workers
  readWorkers: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);
      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const admin = await AdminUser.findOne({
        where: {
          id: adminId,
          type: "admin",
        },
      });

      // check if admin exists
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Admin"),
          {}
        );
      }

      // read all users
      const workers = await AdminUser.findAll({
        where: {
          type: "worker",
        },
        attributes: {
          exclude: ["password"],
        },
      });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Worker", "Read"),
        {
          workers,
        }
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  // block worker
  blockWorker: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);

      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const admin = await AdminUser.findOne({
        where: {
          id: adminId,
          type: "admin",
        },
      });

      // check if admin exists
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Admin"),
          {}
        );
      }

      const { id } = req.params;

      // check if worker exists
      const worker = await AdminUser.findOne({
        where: {
          id,
          type: "worker",
        },
      });

      if (!worker) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Worker"),
          {}
        );
      }

      // block worker
      await worker.update({
        isActive: !worker.isActive,
      });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Worker", "Blocked"),
        {}
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  // Upload barcodes
  uploadBarcodes: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);

      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const admin = await AdminUser.findOne({
        where: {
          id: adminId,
        },
      });

      // check if admin exists
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Admin"),
          {}
        );
      }

      const { barcodes, type } = req.body;

      const ocrCodes = [];

      const tempBarcodes = barcodes.map((barcode) =>
        barcode
          .replaceAll("\n", "")
          .replaceAll("\r", "")
          .replaceAll(".", "")
          .replaceAll(" ", "")
          .replace(/\s/g, "")
      );

      const data = await helpers.getTrackingInformations(tempBarcodes);
      const allTrackings = data.TrackResponse?.TrackInfo;

      for (let i = 0; i < tempBarcodes.length; i++) {
        const barcode = tempBarcodes[i];
        if (!barcode) continue;

        // check if barcode exists
        const check = await BarCode.findOne({
          where: {
            ocrCode: barcode,
          },
        });

        if (check) {
          ocrCodes.push({
            barcode,
            lastDate: check.createdAt,
            status: "already exists",
          });
        } else {
          var status = "good";

          const currentTracking = allTrackings.find(
            (tracking) => tracking["$"]?.ID === barcode
          );

          if (currentTracking)
            if (!currentTracking?.Error?.length > 0) status = "bad";

          if (status === "bad") {
            ocrCodes.push({
              barcode,
              lastDate: new Date(),
              status: "bad status",
            });
          }

          await BarCode.create({
            barcode:
              "uploads/new-barcodes/" + barcode.replaceAll(" ", "") + ".png",
            ocrCode: barcode,
            type,
            admin: adminId,
            adminName: admin.username,
            adminEmail: admin.email,
            status,
          });
        }
      }

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Barcodes", "Uploaded"),
        ocrCodes
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  // Read All barcodes
  readBarcodes: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);

      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const admin = await AdminUser.findOne({
        where: {
          id: adminId,
        },
      });

      // check if admin exists
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Admin"),
          {}
        );
      }

      const page = req.query.page || 1;
      const type = req.query.type || "all";
      const search = req.query.search || "";
      const status = req.query.status || "";

      var query = {
        where: {},
        limit: 20 * page,
        offset: 20 * (page - 1),
        raw: true,
        order: [["createdAt", "DESC"]],
      };

      if (type !== "all") query.where.type = type;
      if (search !== "")
        query.where.ocrCode = { [Op.like]: "%" + search + "%" };
      if (status !== "") query.where.status = status;
      if (!search) query.where.used = false;

      // Read barcodes
      var barcodes = await BarCode.findAll({
        where: {
          admin: adminId,
        },
        limit: 20 * page,
        offset: 20 * (page - 1),
        raw: true,
      });

      var totalBarcodes = await BarCode.count({
        where: {
          admin: adminId,
          used: false,
          status: "good",
        },
      });

      var totalPriorityBarcodes = await BarCode.count({
        where: {
          used: false,
          type: "priority",
          status: "good",
        },
      });

      var totalExpressBarcodes = await BarCode.count({
        where: {
          used: false,
          type: "express",
          status: "good",
        },
      });

      var totalFirstClassBarcodes = await BarCode.count({
        where: {
          used: false,
          type: "firstclass",
          status: "good",
        },
      });

      var totalSignatureBarcodes = await BarCode.count({
        where: {
          used: false,
          type: "signature",
          status: "good",
        },
      });

      if (admin.type === "admin") {
        barcodes = await BarCode.findAll({ ...query });

        totalBarcodes = await BarCode.count({
          where: {
            used: false,
          },
        });
      }

      for (let i = 0; i < barcodes.length; i++) {
        const userId = barcodes[i].admin;
        const user = await AdminUser.findOne({
          where: {
            id: userId,
          },
        });
        barcodes[i].adminName = user?.username;
        barcodes[i].adminEmail = user?.email;
      }

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Admin", "Barcodes Read"),
        {
          barcodes,
          totalBarcodes,
          stats: {
            totalPriorityBarcodes,
            totalExpressBarcodes,
            totalFirstClassBarcodes,
            totalSignatureBarcodes,
          },
        }
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  deleteBarcodes: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);

      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const admin = await AdminUser.findOne({
        where: {
          id: adminId,
        },
      });

      // check if admin exists
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Admin"),
          {}
        );
      }

      const barcodeIds = req.body.barcodeIds;

      // destroy many
      await BarCode.destroy({
        where: {
          id: {
            [Op.in]: barcodeIds,
          },
        },
      });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Barcodes", "Deleted"),
        {}
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  deleteAllBarcodes: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);

      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const admin = await AdminUser.findOne({
        where: {
          id: adminId,
        },
      });

      // check if admin exists
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Admin"),
          {}
        );
      }

      // destroy many
      await BarCode.destroy({
        where: {
          admin: adminId,
          type: req.params.type,
        },
      });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Barcodes", "Deleted"),
        {}
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  // remove all duplicate unused barcodes
  removeDuplicateBarcodes: async (req, res) => {
    try {
      var allUsedBarcodes = await BarCode.findAll({
        where: {
          used: true,
        },
      });

      var allUnsedBarcodes = await BarCode.findAll({
        where: {
          used: false,
        },
      });

      // remove that barcode from allUnusedBarcodes array which is already used
      for (let i = 0; i < allUsedBarcodes.length; i++) {
        for (let j = 0; j < allUnsedBarcodes.length; j++) {
          if (allUsedBarcodes[i].ocrCode === allUnsedBarcodes[j].ocrCode) {
            // delete that barcode from db
            await BarCode.destroy({
              where: {
                id: allUnsedBarcodes[j].id,
              },
            });
          }
        }
      }

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Barcodes", "removed")
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  // read all stats
  readAllStats: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);

      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const admin = await AdminUser.findOne({
        where: {
          id: adminId,
        },
      });

      // check if admin exists
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Admin"),
          {}
        );
      }

      const allStats = await StatsModel.findAll({});

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Stats", "Read"),
        allStats
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  // update states
  updateStats: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);

      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const admin = await AdminUser.findOne({
        where: {
          id: adminId,
        },
      });

      // check if admin exists
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Admin"),
          {}
        );
      }

      const { params } = req.body;
      for (let i = 0; i < params.length; i++) {
        const { attr, value } = params[i];
        await StatsModel.update(
          {
            value,
          },
          {
            where: {
              attr,
            },
          }
        );
      }

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Stats", "Updated")
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  // ####### USERS API #######
  // create user
  createUser: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);

      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const admin = await AdminUser.findOne({
        where: {
          id: adminId,
        },
      });

      // check if admin exists
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Admin"),
          {}
        );
      }

      const { username, email, password } = req.body;

      // check if email already exists
      var checkEmail = await User.findOne({
        where: {
          email,
        },
      });
      var checkUsername = await User.findOne({
        where: {
          email,
        },
      });

      if (checkEmail || checkUsername)
        return helpers.createResponse(
          res,
          constants.UNPROCESSED,
          messages.MODULE_ALREADY_EXIST(checkEmail ? "Email" : "Username"),
          {}
        );

      // create user
      const user = await User.create({
        username,
        email,
        password: await helpers.encrypt(password),
        api_key: await helpers.getKey(),
      });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("User", "Created"),
        user
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  blockUnblockUser: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);

      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const admin = await AdminUser.findOne({
        where: {
          id: adminId,
        },
      });

      // check if admin exists
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Admin"),
          {}
        );
      }

      const { userId } = req.body;

      // check if user exists
      const user = await User.findOne({
        where: {
          id: userId,
        },
      });

      if (!user)
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("User"),
          {}
        );

      const status = !user.isActive;

      // update user status
      await User.update(
        {
          isActive: status,
        },
        {
          where: {
            id: userId,
          },
        }
      );

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("User", status ? "Unblocked" : "Blocked")
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  updateUser: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);

      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const admin = await AdminUser.findOne({
        where: {
          id: adminId,
        },
      });

      // check if admin exists
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Admin"),
          {}
        );
      }

      const { id, username, email, password, balance } = req.body;

      // check if user exists
      const user = await User.findOne({
        where: {
          id,
        },
      });

      if (!user)
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("User"),
          {}
        );

      // update user
      await User.update(
        {
          username,
          email,
        },
        {
          where: {
            id,
          },
        }
      );
      if (password) {
        await User.update(
          {
            password: await helpers.encrypt(password),
          },
          {
            where: {
              id,
            },
          }
        );
      }
      if (balance || balance === 0) {
        await User.update(
          {
            balance,
          },
          {
            where: {
              id,
            },
          }
        );
      }

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("User", "Updated")
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  readAllUsers: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);

      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const admin = await AdminUser.findOne({
        where: {
          id: adminId,
        },
      });

      // check if admin exists
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Admin"),
          {}
        );
      }

      const { page, search } = req.body;

      var searhQuery = {};
      if (search) {
        searhQuery = {
          [Op.or]: [
            {
              username: {
                [Op.like]: `%${search}%`,
              },
            },
            {
              email: {
                [Op.like]: `%${search}%`,
              },
            },
          ],
        };
      }

      // not select password

      var users = await User.findAll({
        limit: 20 * page,
        offset: 20 * (page - 1),
        order: [["createdAt", "DESC"]],
        where: searhQuery,
        attributes: {
          exclude: ["password"],
        },
      });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Users", "Read"),
        {
          users,
          pager: {
            page,
            total: await User.count(),
            search,
          },
        }
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  exRecycleLabel: async (req, res) => {
    try {

       const API_KEY = req.headers["x-api-key"];
      // check if the api key is valid
      if (API_KEY !== env.API_KEY) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }
      var labelId = req.body.id;

      // check if label exists
      var label = await Label.findOne({
        where: {
          id: labelId,
        },
      });

      if (!label) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Label"),
          {}
        );
      }

      var barcode = await BarCode.findOne({
        where: {
          id: label.barcodeId,
        },
      });

      // delete label
      await Label.destroy({
        where: {
          id: labelId,
        },
      });

      // update barcode
      if (barcode)
        await BarCode.update(
          {
            used: false,
            status: "good",
          },
          {
            where: {
              id: barcode.id,
            },
          }
        );
      else
        await BarCode.create({
          ocrCode: label.barcodeOCR,
          barcode: "/",
          type: label.type,
          admin: adminId,
          adminName: admin.username,
          adminEmail: admin.email,
          used: false,
          status: "good",
        });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Label", "recycled"),
        {}
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  // recycle label
  recycleLabel: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const adminId = await helpers.verifyToken(authorization);

      // check if admin exists
      if (!adminId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const admin = await AdminUser.findOne({
        where: {
          id: adminId,
          type: "admin",
        },
      });

      // check if admin exists
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Admin"),
          {}
        );
      }

      var labelId = req.body.id;

      // check if label exists
      var label = await Label.findOne({
        where: {
          id: labelId,
        },
      });

      if (!label) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Label"),
          {}
        );
      }

      var barcode = await BarCode.findOne({
        where: {
          id: label.barcodeId,
        },
      });

      // delete label
      await Label.destroy({
        where: {
          id: labelId,
        },
      });

      // update barcode
      if (barcode)
        await BarCode.update(
          {
            used: false,
            status: "good",
          },
          {
            where: {
              id: barcode.id,
            },
          }
        );
      else
        await BarCode.create({
          ocrCode: label.barcodeOCR,
          barcode: "/",
          type: label.type,
          admin: adminId,
          adminName: admin.username,
          adminEmail: admin.email,
          used: false,
          status: "good",
        });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Label", "recycled"),
        {}
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },

  // read users spending
  readUsersSpending: async (req, res) => {
    try {
      const admin = await getAdmin(req);
      if (!admin) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      // select users by spending
      var users = await User.findAll({
        order: [["spent", "DESC"]],
        attributes: {
          exclude: ["password"],
        },
        limit: 10,
        raw: true,
      });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Users", "Read"),
        users
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
        }
      );
    }
  },
};
