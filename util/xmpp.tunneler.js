/*
 * Server side of a XMPP tunnel
 */

require('../lib/baum.js');

if(process.argv.length < 4){
    console.log('node xmpp.tunneler.js <JID> <PASSWORD>');
    process.exit(1);
};

var jid = process.argv[2],
    password = process.argv[3];

var xmpp = $.xmpp(jid, password);

xmpp.on('data', function(data){
    console.log(data);
});

xmpp.login(true);
