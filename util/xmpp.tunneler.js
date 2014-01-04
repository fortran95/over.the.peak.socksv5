/*
 * Server side of a XMPP tunnel
 */
var sockets = {};

function socket(from, id, xmpp){
    var self = this;
    var state = 0;
    
    var socket = new $.nodejs.net.Socket();

    function send(data){
        if(state < 0) return;
        console.log('DATA SEND to [', from, ']: \n', JSON.stringify(data), '\n-----------');
        data.id = id;
        xmpp.send(from, JSON.stringify(data));
    };

    socket.on('error', function(e){
        send({
            res: 'error',
            err: e.message,
        });
        socket.destroy();
        state = -1;
    });

    socket.on('data', function(data){
        var buf;
        while(data.length > 0){
            buf = data.slice(0, 1024);
            data = data.slice(1024);
            send({
                res: 'data',
                data: buf.toString('hex'),
            });
        };
    });

    socket.on('end', function(data){
        var dataB64 = '';
        if(undefined != data) dataB64 = data.toString('hex');
        send({
            res: 'end',
            data: dataB64,
        });
    });

    socket.on('close', function(){
        state = -1;
        send({
            res: 'close',
        });
    });

    this.receive = function(json){
        switch(state){
            case 0:
                if('connect' != json.cmd || 0 != state)
                    return send({
                        res: 'error',
                    });

                var port = parseInt(json.port), addr = json.addr;

                socket.connect(port, addr, function(){
                    send({
                        res: 'connection',
                    });

                    state = 1;
                });
                break;
            case 1:
                var data;

                if('end' == json.cmd){
                    data = new $.nodejs.buffer.Buffer(json.data, 'hex');
                    socket.end(data);                    
                };

                if('data' == json.cmd){
                    data = new $.nodejs.buffer.Buffer(json.data, 'hex');
                    socket.write(data);
                };

            default:
                break;
        };
    };

    this.state = function(){
        return state;
    };

    return this;
};

//////////////////////////////////////////////////////////////////////////////

function handle(from, json){
    var jid = new $.nodejs.xmpp.JID(from).bare().toString();
    var id = parseInt(json.id);
    if(isNaN(id)) return;

    if(undefined == sockets[jid]) sockets[jid] = {};
    if(undefined == sockets[jid][id]){ 
        sockets[jid][id] = new socket(from, id, xmpp);
    };

    sockets[jid][id].receive(json);
};

//////////////////////////////////////////////////////////////////////////////
require('../lib/baum.js');

if(process.argv.length < 4){
    console.log('node xmpp.tunneler.js <JID> <PASSWORD>');
    process.exit(1);
};

var jid = process.argv[2],
    password = process.argv[3];

xmpp = $.xmpp(jid, password);

xmpp.on('data', function(data){
    console.log('DATA Received: --\n', data.content, '\n-----------------');
    try{
        var json = JSON.parse(data.content);
        handle(data.from, json);
    } catch(e){
    };
});

xmpp.login(true);
