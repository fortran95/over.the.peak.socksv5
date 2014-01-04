/*
 * Server side of a XMPP tunnel
 */
var sockets = {};

function socket(from, id, xmpp){
    var self = this;
    var state = 0, socket = new $.nodejs.net.Socket();

    function send(data){
        data.id = id;
        xmpp.send(from, JSON.stringify(data));
    };

    socket.on('error', function(e){
        send({
            err: e.message,
        });
        socket.destroy();
        state = -1;
    });

    socket.on('data', function(data){
        send({
            res: 'data',
            data: data.toString('base64'),
        });
    });

    socket.on('end', function(data){
        if(undefined == data) return;
        send({
            res: 'end',
            data: data.toString('base64'),
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
                        err: 1
                    });

                var port = parseInt(json.port), addr = json.addr;

                socket.connect(port, addr, function(){
                    send({
                        res: 'connect',
                    });

                    state = 1;
                });
                break;
            case 1:
                var data;

                if('end' == json.cmd){
                    data = new $.nodejs.buffer.Buffer(json.data, 'base64');
                    socket.end(data);                    
                };

                if('data' == json.cmd){
                    data = new $.nodejs.buffer.Buffer(json.data, 'base64');
                    socket.write(data);
                };

            default:
                break;
        };
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
    try{
        var json = JSON.parse(data.content);
        handle(data.from, json);
    } catch(e){
    };
});

xmpp.login(true);
