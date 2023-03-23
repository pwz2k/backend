const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");
const axios = require("axios");
const xml2js = require("xml2js");
const bwipjs = require("bwip-js");

module.exports = {
  // Create Standard response for requests
  createResponse: (res, status, message, payload, pager, header) => {
    pager = typeof pager !== "undefined" ? pager : {};
    header = typeof header !== "undefined" ? header : {};

    return res.status(status).set(header).json({
      message: message,
      payload: payload,
      pager: pager,
    });
  },
  // Encrypt Data
  encrypt: async (cipherText, secret = env.AES_SECRET) => {
    return CryptoJS.AES.encrypt(
      cipherText.toString(),
      CryptoJS.enc.Utf8.parse(secret),
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
      }
    ).toString();
  },

  // verify recpatcha
  verifyRecaptcha: async (req) => {
    const secret = env.RECAPTCHA_SECRET;
    const token = req.body["g-recaptcha-response"];
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`;
    var status = false;
    await axios.get(url).then((rsp) => {
      status = rsp.data.success;
    });
    return status;
  },

  // Decrypt Data
  decrypt: async (cipherText, secret = env.AES_SECRET) => {
    let bytes = CryptoJS.AES.decrypt(
      cipherText.toString(),
      CryptoJS.enc.Utf8.parse(secret),
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    return bytes.toString(CryptoJS.enc.Utf8);
  },

  // Generate JWT Tokens for Users
  generateToken: (data, setExpiry) => {
    if (!setExpiry) {
      return jwt.sign(data, env.JWT_SECRET, {
        algorithm: env.JWT_ALGORITHM,
      });
    } else {
      return jwt.sign(data, env.JWT_SECRET, {
        expiresIn: env.TOKEN_EXPIRY,
        algorithm: env.JWT_ALGORITHM,
      });
    }
  },

  // Verify JWT Tokens for Users
  verifyToken: async (token) => {
    try {
      var decoded = jwt.verify(token.split(" ")[1], env.JWT_SECRET);
      if (decoded) return decoded;
      else return false;
    } catch (err) {
      return false;
    }
  },

  validateBody: (body, params) => {
    let isValid = true;
    params.forEach((param) => {
      if (!body[param]) {
        isValid = false;
      }
    });
    return isValid;
  },

  getTrackingInformation: async (trackingId) => {
    var xmlBodyStr = `
    <TrackRequest USERID="${env.USPS_ID}">
      <TrackID ID="${trackingId}"></TrackID>
    </TrackRequest>
    `;

    var config = {
      headers: { "Content-Type": "text/xml" },
    };

    var data;

    await axios
      .get(
        encodeURI(
          `${env.USPS_BASE_URL}/ShippingAPI.dll?API=TrackV2&XML=${xmlBodyStr}`
        )
      )
      .then((rsp) => {
        data = rsp.data;

        // parse xml data to json
        var parser = new xml2js.Parser();
        parser.parseString(data, function (err, result) {
          data = result;
        });
      })
      .catch((err) => {
        data = err;
      });

    return data;
  },

  getTrackingInformations: async (trackingIds) => {
    var allData = [];

    for (var i = 0; i < Math.ceil(trackingIds.length / 10); i++) {
      const trackingIdsChunk = trackingIds.slice(i * 10, i * 10 + 10);
      if (!trackingIdsChunk.length) continue;

      var xmlBodyStr = `
    <TrackRequest USERID="${env.USPS_ID}">
      ${trackingIdsChunk
        .map((trackingId) => {
          return `<TrackID ID="${trackingId}"></TrackID>`;
        })
        .join("\n")}
    </TrackRequest>
    `;

      await axios
        .get(
          encodeURI(
            `${env.USPS_BASE_URL}/ShippingAPI.dll?API=TrackV2&XML=${xmlBodyStr}`
          )
        )
        .then((rsp) => {
          const data = rsp.data;

          // parse xml data to json
          var parser = new xml2js.Parser();
          parser.parseString(data, function (err, result) {
            allData.push(...result.TrackResponse.TrackInfo);
          });

          console.log(JSON.stringify(allData));
        })
        .catch((err) => {
          data = err;
        });
    }

    return {
      TrackResponse: {
        TrackInfo: allData,
      },
    };
  },

  sendTelegramMessage: async (message) => {
    await axios.get(
      "https://api.telegram.org/bot" +
        env.TG_BOT_TOKEN +
        "/sendMessage?chat_id=" +
        env.TG_CHAT_ID +
        "&parse_mode=Markdown&text=" +
        message.replaceAll("#", "@")
    );
  },

  renderBarcode: async (type = "gs1-128", ocrcode, path) => {
    const value = await new Promise(async (resolve, rejects) => {
      var code = "";
      if (type === "gs1-128") {
        code += "(" + ocrcode.slice(0, 3) + ")";
        code += ocrcode.slice(3, 8);
        code += "(" + ocrcode.slice(8, 10) + ")";
        code += ocrcode.slice(10, 100);
      } else {
        code = ocrcode;
      }

      console.log(code);

      await bwipjs
        .toBuffer({
          bcid: type, // Barcode type
          text: code, // Text to encode
          scale: 3, // 3x scaling factor
          height: 25, // Bar height, in millimeters
          includetext: false, // Show human-readable text
        })
        .then(async (png) => {
          await fs.createWriteStream(path).write(png);
          resolve(true);
        })
        .catch((err) => {
          console.log(err);
        });
    });
    return value;
  },

  getKey: async (length = 32) => {
    var string =
      "abc-defghi-jklmnop-qrs-tuv-wxyzA-BCDE-FGHIJ-KLMNOPQR-STUVWXYZ-01234-56789";
    var key = "";
    for (var i = 0; i < length; i++) {
      key += string.charAt(Math.floor(Math.random() * string.length));
    }
    return key;
  },
};
