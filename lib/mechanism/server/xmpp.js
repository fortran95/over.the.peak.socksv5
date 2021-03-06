/*
 * Server side of a XMPP tunnel
 */
var sockets = {};

function socket(from, id, xmpp){
    var self = this;
    var state = 0,
        streaming = new $.streaming('receiver');
    
    streaming.listenIncomingStream(self);

    function send(data){
        if(state < 0) return;
        console.log('DATA SEND to [', from, ']: \n', JSON.stringify(data), '\n-----------');
        data.id = id;
        xmpp.send(from, JSON.stringify(data));
    };

    /* Handle the incoming stream */
    this.write = function(data){
        if(state <= 0) return;
        var buf;
        while(data.length > 0){
            buf = data.slice(0, 1024);
            data = data.slice(1024);
            send({
                res: 'data',
                data: buf.toString('base64'),
            });
        };
    };

    this.end = function(data){
        if(state <= 0) return;
        var dataB64 = '';
        if(undefined != data) dataB64 = data.toString('base64');
        send({
            res: 'end',
            data: dataB64,
        });
    };

    this.close = function(data){
        if(state <= 0) return;
        state = -1;
        send({
            res: 'close',
        });
    };

    this.connect = function(){
        send({
            res: 'connection',
        });

        state = 1;
    };
    
    this.receive = function(json){
        switch(state){
            case 0:
                if('connect' != json.cmd || 0 != state)
                    return send({
                        res: 'error',
                    });

                var port = parseInt(json.port), addr = json.addr;

                console.log('doing connect');

                streaming.connectOutgoingStream({
                    port: port,
                    addr: addr
                });
                break;
            case 1:
                var data;

                if('end' == json.cmd){
                    data = new $.nodejs.buffer.Buffer(json.data, 'base64');
                    streaming.outgoing.end(data);
                };

                if('data' == json.cmd){
                    data = new $.nodejs.buffer.Buffer(json.data, 'base64');
                    streaming.outgoing.write(data);
                };

            default:
                break;
        };
    };

    this.streaming = function(){
        return streaming;
    };

    return this;
};

//////////////////////////////////////////////////////////////////////////////

function handle(from, json, proxy, xmpp){
    var jid = new $.nodejs.xmpp.JID(from).bare().toString();
    var id = parseInt(json.id);
    if(isNaN(id)) return;

    if(undefined == sockets[jid]) sockets[jid] = {};
    if(undefined == sockets[jid][id]){ 
        sockets[jid][id] = new socket(from, id, xmpp);
        proxy.handle(sockets[jid][id].streaming());
    };

    sockets[jid][id].receive(json);
};

//////////////////////////////////////////////////////////////////////////////

function server(){
    var self = this;

    var configuration = {
            account: null,
            password: null,
        },
        proxy,
        xmpp
    ;

    /* define behaviours */
    this.configure = function(optionName, value){
        if(undefined !== configuration[optionName]){
            configuration[optionName] = value;
            return self;
        } else
            return false;
    };

    this.start = function(){
        if(null == proxy)
            return self.emit('error', 'proxy-server-required');

        console.log('Mechanism Server XMPP:', configuration.account);
        xmpp = new $.xmpp(configuration.account, configuration.password);

        xmpp.on('data', function(data){
            console.log('DATA Received: - XMPP SERVER -\n', data.content, '\n-----------------');
            try{
                var json = JSON.parse(data.content);
                handle(data.from, json, proxy, xmpp);
                console.log(data.from, json);
            } catch(e){
                console.log('! ERR', e);
            };
        });

        xmpp.login(true);
    };

    this.setProxy = function(proxyObject){
        proxy = proxyObject;
        delete self.setProxy;
    };

    return this;
};

//////////////////////////////////////////////////////////////////////////////

module.exports = function(){
    return function(){
        return new server();
    };
};
