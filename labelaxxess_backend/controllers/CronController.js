"use strict";
const Label = require("../models/Label");
const BarCode = require("../models/BarCode");

module.exports = {
  // update label status
  updateLabelStatus: async () => {
    try {
      const labels = await Label.findAll({
        where: {
          status: false,
        },
      });
      const allBarcodes = labels.map((label) =>
        label.barcodeOCR
          .replaceAll("\n", "")
          .replaceAll("\r", "")
          .replaceAll(".", "")
          .replaceAll(" ", "")
          .replace(/\s/g, "")
      );

      // console.log("Lables", allBarcodes);
      if (allBarcodes.length > 0) {
        const data = await helpers.getTrackingInformations(allBarcodes);
        const allTrackings = data.TrackResponse?.TrackInfo;

        // console.log("allTrackings", allTrackings);

        for (let i = 0; i < labels.length; i++) {
          const label = labels[i];
          const barcode = label.barcodeOCR
            .replaceAll("\n", "")
            .replaceAll("\r", "")
            .replaceAll(".", "")
            .replaceAll(" ", "")
            .replace(/\s/g, "");

          const tracking = allTrackings.find(
            (tracking) => tracking["$"]?.ID === barcode
          );

          if (!tracking?.Error?.length > 0) {
            try {
              const trackInfo = tracking;
              const trackSummary = trackInfo?.TrackSummary[0];
              const trackDetail = trackInfo?.TrackDetail;
              const trackDetailLength = trackDetail?.length || 0;
              const tempDetails = [];
              if (trackSummary) tempDetails.push(trackSummary);
              if (trackDetailLength > 0) {
                for (let i = 0; i < trackDetailLength; i++)
                  tempDetails.push(trackDetail[i]);
                tempDetails.push("Label created, not yet in system");
              }

              if (trackSummary?.includes("delivered")) label.status = true;
              label.statusMessage = JSON.stringify(tempDetails);
            } catch (error) {
              // console.log(error);
            }

            await label.save();
          }
        }
      }

      console.log("labels status updated");
    } catch (err) {
      // console.log(err);
      console.log("Error in updateLabelStatus");
    }
  },

  // update barcode status
  checkBarcodes: async () => {
    try {
      const barcodes = await BarCode.findAll({
        used: false,
        createdAt: {
          [Op.gt]: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 30),
        },
      });

      const allBarcodes = barcodes.map((barcode) =>
        barcode.ocrCode
          .replaceAll("\n", "")
          .replaceAll("\r", "")
          .replaceAll(".", "")
          .replaceAll(" ", "")
          .replace(/\s/g, "")
      );

      const data = await helpers.getTrackingInformations(allBarcodes);
      const allTrackings = data.TrackResponse?.TrackInfo;

      for (let i = 0; i < barcodes.length; i++) {
        const barcode = barcodes[i];
        const currentTracking = allTrackings.find(
          (tracking) => tracking["$"]?.ID === allBarcodes[i]
        );
        if (currentTracking)
          if (!currentTracking?.Error?.length > 0) {
            barcode.status = "bad";
            await barcode.save();
          }
      }
    } catch (err) {
      console.log(err);
      console.log("Error in updateLabelStatus");
    }
  },

  fixbarcodeProblem: async () => {
    const barcodes = await BarCode.findAll({
      where: {
        used: true,
        status: "good",
      },
    });

    for (const barcode of barcodes) {
      // console.log("Checking barcode: ", barcode.ocrCode);
      const label = await Label.findOne({
        where: {
          barcodeOCR: barcode.ocrCode,
        },
      });

      if (!label) {
        console.log("Barcode not found in label table");
        barcode.used = false;
        await barcode.save();
      }
    }
  },
};
