"use strict";
const Sequelize = require("sequelize");

const Tickets = DB.define(
  "Tickets",
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
    subject: Sequelize.STRING,
    lastMessageFrom: Sequelize.STRING,
    status: {
      type: Sequelize.STRING,
      defaultValue: "open",
    },
    date: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    lastUpdate: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
    underscored: true,
    tableName: "tickets",
  }
);

module.exports = Tickets;
