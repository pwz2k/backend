const bwipjs = require("bwip-js");

module.exports = {
  gs1Barcode: async (req, res) => {
    bwipjs
      .toBuffer({
        bcid: "gs1-128", // Barcode type
        text: "420971039400109205568500233035", // Text to encode
        scale: 3, // 3x scaling factor
        height: 10, // Bar height, in millimeters
        includetext: false, // Show human-readable text
        textxalign: "center", // Always good to set this
      })
      .then((png) => {
        fs.createWriteStream(rootDir + "/uploads/barcode.png").write(png);
      })
      .catch((err) => {
        // `err` may be a string or Error object
        console.log(err);
      });
    res.status(200);
  },
};
