module.exports = {
  MODULE_STATUS_CHANGE: function (module, status) {
    return module + " has been " + status + " successfully!";
  },
  MODULE_LIST: (module) => {
    return module + " list.";
  },
  MODULE_NOT_FOUND: (module) => {
    return module + " not found.";
  },
  INVALID_INPUT: (param) => {
    return param + " has invalid value.";
  },
  MODULE_ALREADY_EXIST: (module) => {
    return module + " already present.";
  },

  NOT_VALID_PARAMS: "Request has not valid parameters",
  INVLAID_RECAPTHA: "Recaptcha is not valid",
  BARCODE_NOT_FOUND: "Barcode not found",
  BALANCE_SHEET_NOT_AVAILABLE: "Balance sheet not available",
  INSUFFICIENT_BALANCE: "Insufficient balance",

  HEALTH_RESPONSE_OK: "Server health is OK",
  SERVER_ERROR: "Server error.",

  LOGIN_SUCCESS: "Login successful, redirecting....",
  REGISTER_SUCCESS: "Registration successful",

  INVALID_OTP: "Invlid OTP.",
  PASSWORD_NOT_MATCH: "Password doesn't match.",
  INVALID_CREDENTIALS: "Invalid credentials.",
  TOKEN_EXPIRED: "Access token has expired.",
  FILE_NOT_FOUND: "File not found",
  UNAUTHORIZED: "You're not having access of this route.",
  UNAUTHORIZED_ACCESS: "You're not authorized.",

  ORDER_IS_NOT_PAID: "Invoice is not paid.",
  ORDER_FULLFILLED: "Invoice fullfilled successfully.",
  ORDER_CANCELLED: "Invoice cancelled successfully.",
  ORDER_NOT_FOUND: "Invoice not found.",
  ORDER_ALREADY_CANCELLED: "Invoice already cancelled.",
};
