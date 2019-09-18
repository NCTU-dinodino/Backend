var randoms = require('../../../randomVals');

var auth = randoms.randomVals.mailInfo;
console.log(auth);

module.exports = {
    auth: auth
};
