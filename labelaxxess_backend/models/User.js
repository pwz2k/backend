"use strict";
const Sequelize = require("sequelize");

const User = DB.define(
  "User",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    email: Sequelize.STRING,
    password: Sequelize.STRING,

    balance: {
      type: Sequelize.FLOAT,
      defaultValue: 0,
    },
    spent: {
      type: Sequelize.FLOAT,
      defaultValue: 0,
    },
    api_key: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },

    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
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
    tableName: "users",
  }
);

module.exports = User;
