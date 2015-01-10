/*
 * The local server for managing socket sessions.
 *
 */
//////////////////////////////////////////////////////////////////////////////

function localServer(){
    var self = this;

    var sessionManager = require('./localSessionManager.js')(),
        listener = require('./socks4Listener.js')();


    listener.on('connection', function(socks4aConnection){
        sessionManager.manageSocks4aConnection(socks4aConnection);
    });

    return this;
};



//////////////////////////////////////////////////////////////////////////////
module.exports = function(){
    return new localServer();
};
