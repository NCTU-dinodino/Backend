var session = require('client-sessions');
var randoms = require('../randomVals');

// for client session
module.exports.setSessions = function(req, res, next){
  session({
    cookieName: "session",
    secret: randoms.randomVals.sessionKey,
    httpOnly: true,
    secure: true,
    duration: 30 * 60 * 1000,
    activeDuration : 30 * 60 * 1000,
  });
}
