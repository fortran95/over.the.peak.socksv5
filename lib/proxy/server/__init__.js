module.exports = function(){    
    var self = this;

    this.SocksV5 = require('./socksv5.js')();
    this.dummy = require('./dummy.js')();

    return this;
};
