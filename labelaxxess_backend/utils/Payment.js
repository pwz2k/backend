var coinbase = require("coinbase-commerce-node");

module.exports = {
  coinbaseCharge: async (data) => {
    const Client = coinbase.Client;
    Client.init(env.COINBASE_SECRET);
    const Charge = coinbase.resources.Charge;
    var chargeData = {
      name: "Add Balance",
      description: "Add Balance",
      local_price: {
        amount: data.amount,
        currency: "USD",
      },
      pricing_type: "fixed_price",
      metadata: { token: data.token },
    };
    return new Promise((resolve, reject) => {
      Charge.create(chargeData, (err, charge) => {
        if (err) reject(err);
        else resolve(charge);
      });
    });
  },
};
