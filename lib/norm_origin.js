var url = require('url');

module.exports = function (str) {
    if (!/^https?:/.test(str)) str = 'https://' + str;
    var u = url.parse(str);
    return u.protocol + '//' + u.host;
};
