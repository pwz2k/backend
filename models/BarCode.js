"use strict";
const Sequelize = require("sequelize");
const AdminUser = require("./AdminModel");

const BarCode = DB.define(
  "BarCode",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    admin: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: AdminUser,
        key: "id",
      },
    },
    adminName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    adminEmail: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    barcode: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    ocrCode: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: Sequelize.STRING,
      default: "good",
    },
    used: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    type: Sequelize.STRING,
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
    underscored: true,
    tableName: "bar_codes",
  }
);

module.exports = BarCode;
