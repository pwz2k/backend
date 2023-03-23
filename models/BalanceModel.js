"use strict";
const Sequelize = require("sequelize");

const Balance = DB.define(
  "Balance",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user: {
      type: Sequelize.STRING,
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    amount: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },

    paymentUrl: {
      type: Sequelize.TEXT("long"),
    },

    status: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
    underscored: true,
    tableName: "balance",
  }
);

module.exports = Balance;
