const User = require("../models/User");
const Balance = require("../models/BalanceModel");

async function getUser(req) {
  const { authorization } = req.headers;
  if (!authorization) return false;
  const userId = await helpers.verifyToken(authorization);
  if (!userId) return false;
  const user = await User.findOne({ where: { id: userId } });
  if (!user) return false;
  return user;
}

module.exports = {
  create: async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user)
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED_ACCESS
        );

      const { amount } = req.body;

      const balance = await Balance.create({
        user: user.id,
        amount,
        type: "in",
      });

      //  coinbase checkout
      const data = {
        amount,
        token: await helpers.encrypt(
          JSON.stringify({
            id: balance.id,
          })
        ),
      };

      const response = await payments.coinbaseCharge(data);
      var paymentUrl = response?.hosted_url;

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_STATUS_CHANGE("Invoice", "created"),
        {
          paymentUrl,
          id: balance.id,
        }
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

  read: async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user)
        return helpers.createResponse(
          res,
          constants.UNAUTHORIZED,
          messages.UNAUTHORIZED_ACCESS
        );

      const { search, page } = req.body;
      let searchQuery = {};
      if (search)
        searchQuery = {
          [Op.or]: [
            {
              id: {
                [Op.like]: `%${search}%`,
              },
            },
            {
              amount: {
                [Op.like]: `%${search}%`,
              },
            },
            {
              type: {
                [Op.like]: `%${search}%`,
              },
            },
          ],
        };

      const records = await Balance.findAll({
        where: {
          user: user.id,
          ...searchQuery,
        },
        limit: constants.MAX_RECORDS,
        offset: (page - 1) * constants.MAX_RECORDS,
        order: [["createdAt", "DESC"]],
      });

      const totalRecords = await Balance.count();

      const pager = {
        totalRecords,
        totalPage: Math.ceil(totalRecords / constants.MAX_RECORDS),
        page,
        search,
        next:
          page < Math.ceil(totalRecords / constants.MAX_RECORDS)
            ? page + 1
            : null,
        prev: page > 1 ? page - 1 : null,
      };

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.MODULE_LIST("Invoice"),
        records,
        pager
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
