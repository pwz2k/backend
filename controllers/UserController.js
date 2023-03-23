"use strict";
const User = require("../models/User");
const Label = require("../models/Label");

async function getUser(req) {
  const { authorization } = req.headers;
  if (!authorization) return false;
  const userId = await helpers.verifyToken(authorization);
  if (!userId) return false;
  const user = await User.findOne({ where: { id: userId } });
  if (!user) return false;
  return user;
}

var date = new Date();
var year = date.getFullYear();
let fromDate = year;
let fromDay = date.getDate();

let checkDate = new Date(
  date.getFullYear(),
  date.getMonth(),
  date.getDate(),
  0,
  0,
  0
);

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

module.exports = {
  dashboard: async (req, res) => {
    try {
      const user = await getUser(req);

      // check if admin exists
      if (!user) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      // total labels
      const labels = await Label.count({
        where: { user: user.email },
      });

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
              user: user.email,
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
          let labelCount = await Label.count({
            where: {
              user: user.email,
              // createdAt includes date
              createdAt: {
                [Op.between]: [
                  moment(
                    new Date(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate(),
                      0,
                      0,
                      0
                    )
                  )
                    .add(-i, "day")
                    .format("YYYY-MM-DD"),
                  moment(
                    new Date(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate(),
                      0,
                      0,
                      0
                    )
                  )
                    .add(-i + 1, "day")
                    .format("YYYY-MM-DD"),
                ],
              },
            },
          });

          labelStats.push({
            label: moment(
              new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                0,
                0,
                0
              )
            )
              .add(-i, "day")
              .format("YYYY-MM-DD"),
            count: labelCount,
          });
        }
      }

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("User", "Dashboard Read"),
        {
          stats: {
            labels,
            balance: user.balance,
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

  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await User.findOne({
        where: {
          username,
          password: await helpers.encrypt(password),
          isActive: true,
        },
      });

      if (!user) {
        return res.status(400).json({
          message: "Invalid username or password",
        });
      }

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.LOGIN_SUCCESS,
        {
          token: await helpers.generateToken(user.id),
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
      const userId = await helpers.verifyToken(authorization);

      // check if user exists
      if (!userId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const user = await User.findOne({
        where: {
          id: userId,
          isActive: true,
        },
      });

      // check if user exists
      if (!user) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("User"),
          {}
        );
      }

      return helpers.createResponse(res, constants.SUCCESS, messages.SUCCESS, {
        access: true,
        username: user.username,
        balance: user.balance,
        email: user.email,
        apiKey: user.api_key,
      });
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

  generateApiKey: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const userId = await helpers.verifyToken(authorization);

      // check if user exists
      if (!userId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const user = await User.findOne({
        where: {
          id: userId,
        },
      });

      // check if user exists
      if (!user) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("User"),
          {}
        );
      }

      const apiKey = await helpers.getKey();

      await User.update(
        {
          api_key: apiKey,
        },
        {
          where: {
            id: userId,
          },
        }
      );

      return helpers.createResponse(res, constants.SUCCESS, messages.SUCCESS, {
        apiKey,
      });
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
      const userId = await helpers.verifyToken(authorization);

      console.log(userId);

      // check if admin exists
      if (!userId) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );
      }

      const { password } = req.body;
      const user = await User.findOne({
        where: {
          id: userId,
        },
      });

      console.log(user);

      // check if user exists
      if (!user) {
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("user"),
          {}
        );
      }

      // Update password
      await user.update({
        password: await helpers.encrypt(password),
      });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("user", "Password Reset"),
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
};
