class ExpressError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}

module.exports = ExpressError;
