"use strict";
const Sequelize = require("sequelize");

const UserPricing = DB.define(
  "UserPricing",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user: {
      type: Sequelize.INTEGER,
      references: {
        model: "users",
        key: "id",
      },
    },
    type: Sequelize.STRING,
    fromWeight: Sequelize.FLOAT,
    toWeight: Sequelize.FLOAT,
    price: Sequelize.FLOAT,
  },
  {
    timestamps: true,
    freezeTableName: true,
    underscored: true,
    tableName: "user_pricing",
  }
);

module.exports = UserPricing;
