"use strict";
const Sequelize = require("sequelize");

const Label = DB.define(
  "Label",
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
    weight: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    date: {
      type: Sequelize.DATE,
      allowNull: false,
    },

    // from data
    fromCountry: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    fromName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    fromRefNumber: {
      type: Sequelize.STRING,
    },
    fromStreetNumber: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    fromZip: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    fromCity: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    fromState: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    // to data
    toCountry: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    toName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    toRefNumber: {
      type: Sequelize.STRING,
    },
    toStreetNumber: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    toZip: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    toCity: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    toState: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    // barcode
    barcodeOCR: {
      type: Sequelize.STRING,
    },
    barcodeId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    barcodePath: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    pdfPath: {
      type: Sequelize.STRING,
    },

    // status
    status: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    statusMessage: {
      type: Sequelize.TEXT("long"),
    },
    price: {
      type: Sequelize.FLOAT,
      defaultValue: 0,
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
    tableName: "labels",
  }
);

module.exports = Label;
