/*
 * localSessionManager
 *
 * This is the local part of the manager of session system. Sessions are
 * synchronised virtual connections between local and remote server. 
 *
 * The localSessionManager will pack all local connections into a single
 * format, which will be emitted by localAntenna to the remoteSessionManager
 * on the server. It also does authentication with the server.
 *
 * Emits:
 *  `ready`                     for ready managing local sock4a connections
 *  `data`                      for new data needs to be sent
 *  `error` 'authentication'    for authentication error with server
 */

function localSessionManager(){
    var self = this;
    require('events').EventEmitter.call(this);

    var sessions = {};

    function onS4acRequest(sessionID, req){
    };

    function onS4acTerminate(sessionID){
    };

    this.manageSocks4aConnection = function(s4ac){
        // accepts a new local socks4a connection, listen to its 'request'
        // events, and create a proxy session. When successful, connect s4c to
        // this virtual session.

        // sync call, for local session this is ok.
        function getRandomSessionID(callback){
            require('crypto').randomBytes(8, callback);
        };

        function onSessionID(sessionIDBuf){
            var sessionID = sessionIDBuf.toString('hex');
            sessions[sessionID] = {local: s4ac, remote: null};
            s4ac.on('request', (function(sid){
                return function(req){ onS4acRequest(sid, req); };
            })(sessionID));
            s4ac.on('terminate', (function(sid){
                return function(req){ onS4acTerminate(sid); };
            })(sessionID));
        };

        getRandomSessionID(onSessionID);
    };

    this.onRemotePacket = function(packet){
        // when a picket received from localAntenna, it will be forwarded to
        // here.
    };

    return this;
};
require('util').inherits(localSessionManager, require('events').EventEmitter);
