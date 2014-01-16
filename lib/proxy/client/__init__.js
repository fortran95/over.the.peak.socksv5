module.exports = function(){    
    var self = this;

    this.SocksV5 = require('./socksv5.js')();

    return this;
};
