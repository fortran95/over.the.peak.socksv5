function xmppTunnelEntrance($, xmpp, provider){
    $.nodejs.events.EventEmitter.call(this);
    var self = this;
    
    var id = new Date().getTime();

    function send(data){
        data.id = id;
        xmpp.send(provider, JSON.stringify(data));
    };

    xmpp.on('data', function(data){
        
    });

    this.connect = function(port, addr, successCallback){
        console.log(String('Trying to connect ' + addr + ':' + port + ' via XMPP'), port, addr);
        send({
            cmd: 'connect',
            addr: addr,
            port: port,
        });
        // TODO success callback
    };

    this.write = function(data){
    };

    this.close = function(){
    };

    return this;
};

module.exports = function(account, password, provider){
    return function($){
        var xmpp = new $.xmpp(account, password);
        xmpp.login(true);

        return function(){
            return new xmppTunnelEntrance($, xmpp, provider);
        };
    };
};
