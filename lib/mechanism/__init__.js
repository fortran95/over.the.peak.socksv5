module.exports = function(){
    var self = this;

    this.server = require('./server/__init__.js')();
    this.client = require('./client/__init__.js')();

    return this;
};
