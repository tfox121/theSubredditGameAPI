require('dotenv').config();

const Snoowrap = require('snoowrap');

module.exports = new Snoowrap({
  userAgent: process.env.USER_AGENT,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  refreshToken: process.env.REFRESH_TOKEN,
});
