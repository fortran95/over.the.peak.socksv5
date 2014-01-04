/*
 * Server side of a XMPP tunnel
 */
var sockets = {};

function handle(from, json){
    var jid = new $.nodejs.xmpp.JID(from).bare().toString();
    var id = parseInt(json.id);
    if(isNaN(id)) return;

    if(undefined == sockets[jid]) sockets[jid] = {};
    if(undefined == sockets[jid][id]) 
        sockets[jid][id] = new $.nodejs.net.Socket();


};

//////////////////////////////////////////////////////////////////////////////
require('../lib/baum.js');

if(process.argv.length < 4){
    console.log('node xmpp.tunneler.js <JID> <PASSWORD>');
    process.exit(1);
};

var jid = process.argv[2],
    password = process.argv[3];

var xmpp = $.xmpp(jid, password);

xmpp.on('data', function(data){
    try{
        var json = JSON.parse(data);
        handle(data.from, json);
    } catch(e){
    };
});

xmpp.login(true);
