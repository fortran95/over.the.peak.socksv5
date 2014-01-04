/*
 * Server side of a XMPP tunnel
 */

require('../lib/baum.js');

var jid = process.argv[2],
    password = process.argv[3];

console.log(jid, password);
