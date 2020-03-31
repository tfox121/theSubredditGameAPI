if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const snoowrap = require('snoowrap');

module.exports = new snoowrap({
  userAgent: process.env.USER_AGENT,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  refreshToken: process.env.REFRESH_TOKEN
});
