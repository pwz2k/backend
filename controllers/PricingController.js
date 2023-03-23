const Pricing = require("../models/PricingModel");
const UserPricing = require("../models/UserPricing");
const User = require("../models/User");
const Admin = require("../models/AdminModel");

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
  const admin = await Admin.findOne({ where: { id: adminId } });
  if (!admin) return false;
  return admin;
}

module.exports = {
  // global pricing
  createPricing: async (req, res) => {
    try {
      const admin = await getAdmin(req);
      if (!admin)
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED_ACCESS
        );

      const { type, fromWeight, toWeight, price } = req.body;

      const pricing = await Pricing.create({
        type,
        fromWeight,
        toWeight,
        price,
      });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Weight", "created"),
        pricing
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR
      );
    }
  },

  readPricing: async (req, res) => {
    try {
      const user = await getUser(req);
      const admin = await getAdmin(req);
      if (!user && !admin)
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED_ACCESS
        );

      var pricing;
      if (admin) pricing = await Pricing.findAll();
      if (user) {
        const { id } = user;
        var userPricing = await UserPricing.findAll({ where: { user: id } });
        pricing = await Pricing.findAll();

        for (var i = 0; i < userPricing.length; i++) {
          var userPricingObj = userPricing[i];
          var index = pricing.findIndex(
            (x) =>
              x.type == userPricingObj.type &&
              x.fromWeight == userPricingObj.fromWeight &&
              x.toWeight == userPricingObj.toWeight
          );

          if (index != -1) {
            pricing[index].price = userPricingObj.price;
          }else{
            pricing.push(userPricingObj);
          }
        }
      }

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Weight", "read"),
        pricing
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR
      );
    }
  },

  updatePricing: async (req, res) => {
    try {
      const admin = await getAdmin(req);
      if (!admin)
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED_ACCESS
        );

      const { id, type, fromWeight, toWeight, price } = req.body;

      const pricing = await Pricing.findOne({ where: { id } });

      if (!pricing)
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Weight")
        );

      await pricing.update({
        type,
        fromWeight,
        toWeight,
        price,
      });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Weight", "updated"),
        pricing
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR
      );
    }
  },

  deletePricing: async (req, res) => {
    try {
      const admin = await getAdmin(req);
      if (!admin)
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED_ACCESS
        );

      const id = req.params.id;

      const pricing = await Pricing.findOne({ where: { id } });

      if (!pricing)
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Weight")
        );

      await pricing.destroy();

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Weight", "deleted")
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR
      );
    }
  },

  // user pricing

  createUserPricing: async (req, res) => {
    try {
      const admin = await getAdmin(req);
      if (!admin)
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED_ACCESS
        );

      const { userId, type, fromWeight, toWeight, price } = req.body;

      const user = await User.findOne({ where: { id: userId } });

      if (!user)
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("User")
        );

      const pricing = await UserPricing.create({
        user: userId,
        type,
        fromWeight,
        toWeight,
        price,
      });

      console.log(pricing);

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Pricing", "created"),
        pricing
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR
      );
    }
  },

  getUserPricing: async (req, res) => {
    try {
      const user = await getUser(req);
      const admin = await getAdmin(req);
      if (!user && !admin)
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED_ACCESS
        );

      var pricing = [];
      if (user)
        pricing = await UserPricing.findAll({ where: { user: user.id } });
      else if (admin)
        pricing = await UserPricing.findAll({
          where: { user: req.params.userId },
        });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Pricing", "read"),
        pricing
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR
      );
    }
  },

  updateUserPricing: async (req, res) => {
    try {
      const admin = await getAdmin(req);
      if (!admin)
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED_ACCESS
        );

      const { id, type, fromWeight, toWeight, price } = req.body;

      const pricing = await UserPricing.findOne({ where: { id } });
      if (!pricing)
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Pricing")
        );

      await pricing.update({
        type,
        fromWeight,
        toWeight,
        price,
      });

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Weight", "updated"),
        pricing
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR
      );
    }
  },

  deleteUserPricing: async (req, res) => {
    try {
      const admin = await getAdmin(req);
      if (!admin)
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED_ACCESS
        );

      const id = req.params.id;

      const pricing = await UserPricing.findOne({ where: { id } });

      if (!pricing)
        return helpers.createResponse(
          res,
          constants.NOT_FOUND,
          messages.MODULE_NOT_FOUND("Pricing")
        );

      await pricing.destroy();

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Pricing", "deleted")
      );
    } catch (err) {
      console.log(err);
      return helpers.createResponse(
        res,
        constants.SERVER_ERROR,
        messages.SERVER_ERROR
      );
    }
  },
};
