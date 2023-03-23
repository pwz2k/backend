"use strict";
const Sequelize = require("sequelize");

const Pricing = DB.define(
  "Pricing",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    tableName: "pricing",
  }
);

module.exports = Pricing;
