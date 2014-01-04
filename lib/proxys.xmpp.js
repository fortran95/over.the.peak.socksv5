function xmppTunnelEntrance($, account, password){
    $.nodejs.events.EventEmitter.call(this);
    var self = this;

    return this;
};

module.exports = function(account, password){
    return function($){
        return function(){
            return new xmppTunnelEntrance($, account, password);
        };
    };
};
