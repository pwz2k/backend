"use strict";
// const puppeteer = require("puppeteer");
const BarCode = require("../models/BarCode");
const StatsModel = require("../models/StatsModel");
const AdminUser = require("../models/AdminModel");
const Label = require("../models/Label");
var fs = require("fs");
var pdf = require("html-pdf");
const bwipjs = require("bwip-js");
const User = require("../models/User");
const Pricing = require("../models/PricingModel");
const UserPricing = require("../models/UserPricing");
const Op = require("sequelize").Op;

const E = fs.readFileSync(rootDir + "/templates/E.html", "utf8");
const P = fs.readFileSync(rootDir + "/templates/P.html", "utf8");
const F = fs.readFileSync(rootDir + "/templates/F.html", "utf8");
const SIGN = fs.readFileSync(rootDir + "/templates/SIGN.html", "utf8");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getHeight = (body) => {
  if (
    body.fromRefNumber &&
    body.toRefNumber &&
    body.fromStreetNumber &&
    body.toStreetNumber &&
    body.fromStreetNumber2 &&
    body.toStreetNumber2
  ) {
    return 310;
  } else if (
    (!body.fromStreetNumber2 || !body.toStreetNumber2) &&
    (body.fromRefNumber || body.toRefNumber)
  ) {
    return 306;
  } else if (
    ((!body.fromRefNumber || !body.toRefNumber) && body.fromStreetNumber2) ||
    body.toStreetNumber2
  ) {
    return 306;
  } else if (
    body.fromRefNumber ||
    body.toRefNumber ||
    body.fromStreetNumber2 ||
    body.toStreetNumber2
  ) {
    return 306;
  } else return 300;
};

async function getUser(req) {
  const { authorization } = req.headers;
  if (!authorization) return false;
  const userId = await helpers.verifyToken(authorization);
  if (!userId) return false;
  const user = await User.findOne({ where: { id: userId } });
  if (!user) return false;
  return user;
}

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
  // create a new label
  create: async (req, res) => {
    try {
      const API_KEY = req.headers["x-api-key"];
      const body = req.body;

      var isAdminKey = API_KEY === env.API_KEY;
      var user = await User.findOne({
        where: { api_key: API_KEY, isActive: true },
      });

      // check if the api key is valid
      if (!isAdminKey && !user) {
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {
            status: 1001,
            message: "Invalid Key",
          }
        );
      }

      // validate type
      if (
        body.type !== "express" &&
        body.type !== "priority" &&
        body.type !== "firstclass" &&
        body.type !== "signature"
      ) {
        return helpers.createResponse(
          res,
          constants.BAD_REQUEST,
          messages.INVALID_INPUT("type"),
          {
            code: 1002,
            message:
              "Invalid type, type should be express, priority or firstclass",
          }
        );
      }

      // check if the body is valid
      const params = [
        "type",
        "weight",
        "date",
        "fromCountry",
        "fromName",
        "fromStreetNumber",
        "fromZip",
        "fromCity",
        "fromState",
        "toCountry",
        "toName",
        "toStreetNumber",
        "toZip",
        "toCity",
        "toState",
      ];

      // if any parameter is length > 20, return error

      if (body["fromName"].length > 30) {
        return helpers.createResponse(
          res,
          constants.BAD_REQUEST,
          "The 'fromName' parameter is too long. Maximum length is 30",
          {
            code: 1003,
            message:
              "The 'fromName' parameter is too long. Maximum length is 30",
            fromName: body["fromName"],
          }
        );
      }

      const isValid = helpers.validateBody(body, params);
      if (!isValid) {
        return helpers.createResponse(
          res,
          constants.BAD_REQUEST,
          messages.NOT_VALID_PARAMS,
          {
            code: 1004,
            message: messages.NOT_VALID_PARAMS,
          }
        );
      }

      const stats = await StatsModel.findOne({
        where: {
          attr:
            body.type === "express"
              ? "express_weight"
              : body.type === "priority"
              ? "priority_weight"
              : body.type === "firstclass"
              ? "firstclass_weight"
              : "signature_weight",
        },
      });

      if (parseFloat(stats.value) < parseFloat(body.weight))
        return helpers.createResponse(
          res,
          constants.BAD_REQUEST,
          "Invalid Weight. Maximum weight is " + stats.value,
          {
            code: 1005,
            message: "Invalid Weight. Maximum weight is " + stats.value,
          }
        );

      var email = user ? user.email : "admin";

      // user validations
      var pricing = {};

      if (user) {
        // fetch special user pricing
        var allUserPricing = await UserPricing.findAll({
          where: {
            user: user.id,
            type: body.type,
          },
        });
        if (allUserPricing.length > 0)
          pricing = allUserPricing.find((p) => {
            return (
              parseFloat(p.fromWeight) <= parseFloat(body.weight) &&
              parseFloat(p.toWeight) >= parseFloat(body.weight)
            );
          });

        // if user doesn't have special pricing
        if (!pricing || Object.keys(pricing).length === 0) {
          var allPricing = await Pricing.findAll({
            where: {
              type: body.type,
            },
          });

          if (allPricing.length > 0)
            pricing = await allPricing.find((p) => {
              return (
                parseFloat(p.fromWeight) <= parseFloat(body.weight) &&
                parseFloat(p.toWeight) >= parseFloat(body.weight)
              );
            });
        }

        if (!pricing || Object.keys(pricing).length === 0) {
          return helpers.createResponse(
            res,
            constants.BAD_REQUEST,
            messages.BALANCE_SHEET_NOT_AVAILABLE,
            {
              code: 1006,
              message: "Price not available for this weight",
            }
          );
        }

        // check if the user has enough balance
        if (user.balance < pricing.price) {
          return helpers.createResponse(
            res,
            constants.BAD_REQUEST,
            messages.INSUFFICIENT_BALANCE,
            {
              code: 102,
              message: "Insufficient balance",
            }
          );
        }
      }

      // check if the barcode is valid
      const barcodes = await BarCode.findAll({
        where: {
          used: false,
          status: "good",
          type: body.type,
        },
        limit: 1,
        offset: parseInt(process.env.NODE_APP_INSTANCE) || 0,
      });

      if (barcodes.length === 0) {
        return helpers.createResponse(
          res,
          constants.BAD_REQUEST,
          messages.BARCODE_NOT_FOUND,
          {
            code: 1008,
            message: "Barcode not available for this type",
          }
        );
      }
      const barcode = barcodes[0];

      await barcode.update({
        used: true,
      });

      const ocrcode =
        "420" + body.toZip.slice(0, 5) + barcode.ocrCode.replaceAll(" ", "");

      var path =
        "uploads/new-barcodes/" + barcode.ocrCode.replaceAll(" ", "") + ".png";

      var code = "";
      code += "(" + ocrcode.slice(0, 3) + ")";
      code += ocrcode.slice(3, 8);
      code += "(" + ocrcode.slice(8, 10) + ")";
      code += ocrcode.slice(10, 100);

      await bwipjs
        .toBuffer({
          bcid: "gs1-128", // Barcode type
          text: code, // Text to encode
          scale: 3, // 3x scaling factor
          height: 15, // Bar height, in millimeters
          includetext: false, // Show human-readable text
        })
        .then(async (png) => {
          // await fs.createWriteStream(path).write(png);
          // const barImage = fs.readFileSync(rootDir + "/" + barcode.barcode);
          // // conver to base64
          const barBase64 = new Buffer.from(png).toString("base64");

          // check for types
          const tmpl =
            body.type === "express"
              ? E
              : body.type === "priority"
              ? P
              : body.type === "firstclass"
              ? F
              : SIGN;

          var html = tmpl.replace("{{fromName}}", body.fromName.toUpperCase());

          if (body.fromRefNumber)
            html = html.replace(
              "{{refNumber}}",
              body.fromRefNumber.toUpperCase() + "<br>"
            );
          else html = html.replace("{{refNumber}}", "");

          html = html.replace(
            "{{fromStreet}}",
            body.fromStreetNumber.toString().toUpperCase()
          );

          if (body.fromStreetNumber2)
            html = html.replace(
              "{{fromStreet2}}",
              body.fromStreetNumber2.toString().toUpperCase() + "<br>"
            );
          else html = html.replace("{{fromStreet2}}", "");

          html = html.replace(
            "{{fromCity}}",
            body.fromCity.toString().toUpperCase()
          );
          html = html.replace(
            "{{fromState}}",
            body.fromState.toString().toUpperCase()
          );

          const fromZip = body.fromZip.toString().endsWith("-")
            ? body.fromZip
                .toString()
                .substr(0, body.fromZip.toString().length - 1)
            : body.fromZip.toString();
          html = html.replace("{{fromZip}}", fromZip.toUpperCase());

          html = html.replace(
            "{{labelDate}}",
            moment(body.date).format("MM/DD/YY")
          );
          html = html.replace("{{packageWeight}}", body.weight);

          html = html.replace("{{toName}}", body.toName.toUpperCase());
          if (body.toRefNumber)
            html = html.replace(
              "{{toRefNumber}}",
              body.toRefNumber?.toUpperCase() + "<br>"
            );
          else html = html.replace("{{toRefNumber}}", "");

          html = html.replace(
            "{{toStreet}}",
            body.toStreetNumber.toString().toUpperCase()
          );

          if (body.toStreetNumber2)
            html = html.replace(
              "{{toStreet2}}",
              body.toStreetNumber2.toString().toUpperCase() + "<br>"
            );
          else html = html.replace("{{toStreet2}}", "");

          html = html.replace(
            "{{toCity}}",
            body.toCity.toString().toUpperCase()
          );
          html = html.replace(
            "{{toState}}",
            body.toState.toString().toUpperCase()
          );

          const toZip = body.toZip.toString().endsWith("-")
            ? body.toZip.toString().substr(0, body.toZip.toString().length - 1)
            : body.toZip.toString();
          html = html.replace("{{toZip}}", toZip.toUpperCase());

          html = html.replace("{{barImage}}", barBase64);

          var codeTemp = barcode.ocrCode.replaceAll(" ", "");
          var code = "";
          for (let i = 0; i < Math.ceil(codeTemp.length / 4); i++) {
            code = code + codeTemp.substr(i * 4, 4) + " ";
          }

          html = html.replace("{{barcode}}", code);

          // console.log(html)

          const pdfPath =
            "/labels/" + barcode.ocrCode + "-" + new Date().getTime() + ".pdf";
          const pdfURL = env.API_DOMAIN + pdfPath;

          const result = await new Promise((resolve, reject) => {
            pdf
              .create(html, {
                width: "212mm",
                height: getHeight(body) + "mm",
                border: {
                  top: "0.5mm", // default is 0, units: mm, cm, in, px
                  right: "0.5mm",
                  bottom: "0.5mm",
                  left: "0.5mm",
                },
              })
              .toFile(rootDir + pdfPath, async (err, rsp) => {
                if (err) console.log(err);
                if (rsp) {
                  console.log("done");
                  // create label
                  const count = await Label.count({
                    where: {
                      barcodeOCR: barcode.ocrCode,
                    },
                  });

                  console.log(count, barcode.ocrCode);

                  if (count === 0) {
                    var label;
                    try {
                      label = await Label.create({
                        ...body,
                        user: email,
                        barcodeId: barcode.id,
                        barcodeOCR: barcode.ocrCode,
                        barcodePath: barcode.barcode,
                        pdfPath,
                        price: pricing?.price || 0,
                      });
                    } catch (err) {
                      console.log(err, 1);
                      if (label) await label.destroy();
                      resolve(false);
                    }

                    const barcodeStats = await StatsModel.findOne({
                      where: {
                        attr:
                          body.type === "priority"
                            ? "priority_minimum_stock"
                            : body.type === "express"
                            ? "express_minimum_stock"
                            : body.type === "firstclass"
                            ? "firstclass_minimum_stock"
                            : "signature_minimum_stock",
                      },
                    });

                    const availableBarcodes = await BarCode.findAll({
                      where: {
                        used: false,
                        status: "good",
                        type: body.type,
                      },
                    });

                    if (
                      parseInt(barcodeStats.value) === availableBarcodes.length
                    ) {
                      const tgMessage = `Low on barcodes ${body.type}: ${availableBarcodes.length}`;
                      await helpers.sendTelegramMessage(tgMessage);
                    }
                    resolve(label);
                  } else {
                    console.log("ERROR", 2);
                    await barcode.update({
                      used: true,
                      status: "bad",
                    });
                    resolve(false);
                  }
                }
              });
          });

          if (result) {
            while (!fs.existsSync(rootDir + pdfPath)) {
              await delay(200);
            }
            // deduct user balance

            if (user) {
              if (user.balance < pricing.price) {
                await barcode.update({
                  used: false,
                });
                return helpers.createResponse(
                  res,
                  constants.BAD_REQUEST,
                  messages.INSUFFICIENT_BALANCE,
                  {
                    code: 1007,
                    message: "Insufficient balance",
                  }
                );
              }
              await user.update({
                balance: user.balance - pricing.price,
                spent: user.spent + pricing.price,
              });
            }
            return helpers.createResponse(
              res,
              constants.SUCCESS,
              messages.MODULE_STATUS_CHANGE("Label", "generated"),
              {
                id: result.id,
                code: barcode.ocrCode,
                pdf: pdfURL,
              }
            );
          } else {
            await barcode.update({
              used: false,
            });
            return helpers.createResponse(
              res,
              constants.BAD_REQUEST,
              messages.MODULE_ALREADY_EXIST("BARCODE") + " try after sometime",
              {
                code: 1009,
                message: "Label generation faild. try after sometime",
              }
            );
          }
        })
        .catch(async (err) => {
          await barcode.update({
            used: false,
          });
          console.log(err);
          return helpers.createResponse(
            res,
            constants.BAD_REQUEST,
            messages.MODULE_ALREADY_EXIST("BARCODE") + " try after sometime",
            {
              code: 1009,
              message: "Label generation faild. try after sometime",
            }
          );
        });
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR,
        {
          error: err.message,
          code: 1010,
          message: "Internal server error.",
        }
      );
    }
  },

  // Read All Labels
  readAll: async (req, res) => {
    try {
      const user = await getUser(req);
      const admin = await getAdmin(req);
      const search = req.query.search;

      // check if admin exists
      if (!user && !admin)
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED,
          {}
        );

      const page = req.query.page || 1;
      var labels = [];

      var searchQuery = {};
      if (search) {
        searchQuery = {
          [Op.or]: [
            { fromName: { [Op.like]: "%" + search + "%" } },
            { type: { [Op.like]: "%" + search + "%" } },
            { toName: { [Op.like]: "%" + search + "%" } },
            { barcodeOCR: { [Op.like]: "%" + search + "%" } },
            { weight: parseFloat(search) },
          ],
        };
      }

      if (user)
        labels = await Label.findAll({
          where: {
            user: user.email,
            ...searchQuery,
          },
          limit: 20 * page,
          offset: 20 * (page - 1),
          order: [["createdAt", "DESC"]],
        });
      else
        labels = await Label.findAll({
          where: {
            ...searchQuery,
          },
          limit: 20,
          offset: 20 * (page - 1),
          order: [["createdAt", "DESC"]],
        });

      var totalLabels = 1;
      if (user)
        totalLabels = await Label.count({
          where: {
            user: user.email,
            ...searchQuery,
          },
        });
      else
        totalLabels = await Label.count({
          where: {
            ...searchQuery,
          },
        });

      var tempLabels = [];
      for (var i = 0; i < labels.length; i++) {
        var label = labels[i];

        label.status = label.status
          ? "delivered"
          : !JSON.parse(label.statusMessage)?.length
          ? "awaiting"
          : "inProgress";

        tempLabels.push(label);
      }

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Label", "read"),
        {
          labels: tempLabels,
          totalLabels,
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

  // read signle label
  read: async (req, res) => {
    try {
      // const API_KEY = req.headers["x-api-key"];
      // // check if the api key is valid
      // if (API_KEY !== env.API_KEY) {
      //   return helpers.createResponse(
      //     res,
      //     constants.UNAUTHORIZED,
      //     messages.UNAUTHORIZED,
      //     {}
      //   );
      // }

      const label = await Label.findOne({
        where: {
          id: req.params.id,
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

      label.pdfPath = env.API_DOMAIN + label.pdfPath;

      label.status = label.status
        ? "delivered"
        : !JSON.parse(label.statusMessage)?.length
        ? "awaiting"
        : "inProgress";

      var temp = JSON.parse(JSON.stringify(label));
      delete temp.barcodePath;

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Label", "read"),
        {
          temp,
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

  fixBarcodeProblem: async (req, res) => {
    try {
      const barcodes = await BarCode.findAll({
        where: {
          used: false,
          status: "good",
        },
      });

      for (const barcode of barcodes) {
        console.log("Checking barcode: ", barcode.ocrCode);
        const label = await Label.findOne({
          where: {
            barcodeOCR: barcode.ocrCode,
          },
        });

        if (!label) {
          console.log("Barcode not found in label table");
          // barcode.used = false;
          // await barcode.save();
        } else {
          console.log("Barcode found in label table");
          barcode.used = true;
          barcode.status = "bad";
          await barcode.save();
        }
      }

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Barcode", "Fixed"),
        {}
      );
    } catch (err) {
      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Barcode", "Fixed Error"),
        {}
      );
    }
  },
};
