"use strict";
const Sequelize = require("sequelize");

const Stats = DB.define(
  "Stats",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    attr: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    value: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
    underscored: true,
    tableName: "stats",
  }
);

module.exports = Stats;
