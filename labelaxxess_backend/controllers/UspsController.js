const AdminUser = require("../models/AdminModel");
const USPS = require("usps-webtools");
const usps = new USPS({
  server: env.USPS_BASE_URL + "/ShippingAPI.dll",
  userId: env.USPS_ID,
  ttl: 10000, //TTL in milliseconds for request
});

module.exports = {
  // check access
  validateAddress: async (req, res) => {
    try {
      const body = req.body;

      const obj = {};
      if (body.street1) obj.street1 = body.street1;
      if (body.street2) obj.street2 = body.street2;
      if (body.city) obj.city = body.city;
      if (body.state) obj.state = body.state;
      if (body.zip) obj.zip = body.zip;

      var response = await new Promise((resolve, reject) => {
        usps.verify(obj, function (err, address) {
          if (err) {
            console.log(err);
            resolve(null);
          } else {
            resolve(address);
          }
        });
      });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Admin", "address read"),
        response
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

  zipCodeLookup: async (req, res) => {
    try {
      const body = req.body;

      const obj = {};
      if (body.street1) obj.street1 = body.street1;
      if (body.street2) obj.street2 = body.street2;
      if (body.city) obj.city = body.city;
      if (body.state) obj.state = body.state;
      if (body.zip) obj.zip = body.zip;

      var response = await new Promise((resolve, reject) => {
        usps.zipCodeLookup(obj, function (err, result) {
          if (err) {
            resolve(null);
          } else {
            resolve(result);
          }
        });
      });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Admin", "zip code read"),
        response
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

  cityStateLookup: async (req, res) => {
    try {
      const body = req.body;

      var response = await new Promise((resolve, reject) => {
        usps.cityStateLookup({ zip: body.zip }, function (err, result) {
          if (err) {
            resolve(null);
          } else {
            resolve(result);
          }
        });
      });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Admin", "city state read"),
        response
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
