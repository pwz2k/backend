"use strict";
const Sequelize = require("sequelize");

const AdminUser = DB.define(
  "AdminUser",
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
    type: {
      type: Sequelize.STRING,
      defaultValue: "worker",
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
    tableName: "admin_users",
  }
);

module.exports = AdminUser;
