module.exports = function(){    
    var self = this;

    this.XMPP = require('./xmpp.js')();

    return this;
};
