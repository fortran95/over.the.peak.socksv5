module.exports = function(){    
    var self = this;

    this.XMPP = require('./xmpp.js')();
    this.dummy = require('./dummy.js')();

    return this;
};
