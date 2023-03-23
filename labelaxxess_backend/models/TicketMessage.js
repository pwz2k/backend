"use strict";
const Sequelize = require("sequelize");

const TicketMessage = DB.define(
  "TicketMessage",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ticketId: {
      type: Sequelize.INTEGER,
      references: {
        model: "tickets",
        key: "id",
      },
    },
    message: {
      type: Sequelize.TEXT("long"),
    },
    from: Sequelize.STRING,
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
    tableName: "ticket_messages",
  }
);

module.exports = TicketMessage;
