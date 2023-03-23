const Balance = require("../models/BalanceModel");
const User = require("../models/User");

async function addBalance(balanceId) {
  const balance = await Balance.findOne({ where: { id: balanceId } });
  if (!balance) return false;
  const user = await User.findOne({ where: { id: balance.user } });
  if (!user) return false;
  user.balance += balance.amount;
  await user.save();
  return true;
}

module.exports = {
  coinbase: async (req, res) => {
    try {
      const event = req.body.event;

      if (event.type === "charge:confirmed") {
        const token = event.data.metadata.token;
        if (token) {
          try {
            const tokenObj = JSON.parse(await helpers.decrypt(token));
            addBalance(tokenObj.id);

            return helpers.createResponse(
              res,
              constants.SUCCESS,
              messages.ORDER_FULLFILLED
            );
          } catch (err) {
            console.log(err);
          }
        }
      }

      return helpers.createResponse(
        res,
        constants.SUCCESS,
        messages.ORDER_IS_NOT_PAID
      );
    } catch (err) {
      console.log(err);
      return createResponse(
        res,
        constants.SUCCESS,
        err.message || messages.SERVER_ERROR
      );
    }
  },
};
