/*
 * socks4Listener
 *
 * Using `new socks4Listener()` will create a socket listening on localhost.
 * This is an inherited EventEmitter, which emits `connection` when local
 * clients connected. 
 * An instance of `socks4Connection` emitted with event `connection` should be
 * passed to local service, which is responsible for things like creating a new
 * session for it, or reject this connection.
 */

//////////////////////////////////////////////////////////////////////////////

function socks4Connection(socket, config){
    var self = this;
    require('events').EventEmitter.call(this);

    var buffer = require('buffer');

    var stat = {
        handshook: false,
        terminated: false,
        target: null,
        targetType: null,
        targetPort: null,
    };

    function _answerHandshake(success){
        if(stat.terminated || stat.handshook) return;
        var number = (success?90:91);
        socket.write(new buffer.Buffer([0, number, 0, 0, 0, 0, 0, 0]));
        // we set ip and port to all-zero, which is OK when only CONNECT
        // operation is considered
    };

    var doBreakPiping = function(){};

    function doTerminate(){
        if(stat.terminated) return;
        self.emit('terminate');
        try{
            doBreakPiping();
            socket.end();
        } catch(e){
        };
        stat.terminated = true;
    };

    function doRejection(){
        if(stat.terminated) return;
        try{
            _answerHandshake(false);
            doTerminate();
        } catch(e){
        };
    };

    function doConnect(stream){
        if(stat.terminated || stat.handshook) return;
        try{
            _answerHandshake(true);
            stat.handshook = true;
        } catch(e){
        };
        
        socket.pipe(stream);
        stream.pipe(socket);
        doBreakPiping = function(){
            socket.unpipe(stream);
            stream.unpipe(socket);
        };
        stream.on('error', doTerminate);
        stream.on('end', doTerminate);
    };

    function onHandshake(dataBuf){
        if(dataBuf.length < 8) return doRejection();
        if(4 != dataBuf[0]) return doRejection();
        if(1 != dataBuf[1]) return doRejection(); // not supporting BIND

        // extract port and hostname

        var port = (dataBuf[2] << 8) + dataBuf[3];
        var target = '';
        var type = ''; // type when specifying the target
        if( 0 == dataBuf[4] && 0 == dataBuf[5] && 0 == dataBuf[6]){
            var subBuf = dataBuf.slice(8);
            while(subBuf.length > 0 && 0 != subBuf[0])
                subBuf = subBuf.slice(1);
            if(!(
                0 == subBuf[0] &&
                0 == subBuf[subBuf.length - 1]
            ))
                return doRejection();
            target = subBuf.slice(1,-1).toString();
            type = 'hostname';
        } else {
            target = String(
                dataBuf[4].toString(10) + '.'
                + dataBuf[5].toString(10) + '.'
                + dataBuf[6].toString(10) + '.'
                + dataBuf[7]
            );
            type = 'ip';
        };

        // apply policy of allowHostname & allowIP

        if('ip' == type && !config.allowIP) return doRejection();
        if('hostname' == type && !config.allowHostname) return doRejection();

        // accept local connection, seek for remote proxying
       
        stat.targetType = type;
        stat.target = target;
        stat.targetPort = port;

        self.emit('request', {
            target: target,
            port: port,
            type: type,
            action: 'connect',
        });

        self.reject = _reject;
        self.connect = _connect;
    };

    //------------------------------------------------------------------//
    
    function _reject(){
        doRejection();
        delete self.reject;
        delete self.connect;
    };

    function _connect(stream){
        // TODO connect this stream and its events to socket.
        doConnect(stream);
        delete self.reject;
        delete self.connect;
    };

    this.terminate = function(){
        doTerminate();
    };

    //------------------------------------------------------------------//

    socket.on('data', function(dataBuf){
        if(stat.terminated) return;
        if(!stat.handshook) return onHandshake(dataBuf);
    });

    socket.on('error', function(){
        stat.terminated = true;
        try{
            socket.destroy();
        } catch(e){
        };
    });

    return self;
};
require('util').inherits(socks4Connection, require('events').EventEmitter);

//////////////////////////////////////////////////////////////////////////////

function socks4Listener(c){
    var self = this;
    require('events').EventEmitter.call(this);

    var config = {
        port: 8964,
        allowHostname: true,
        allowIP: false,
    };
    if(c) for(var k in config) if(undefined !== c[k]) config[k] = c[k];
    
    //------------------------------------------------------------------//

    var socket = require('net').createServer(onConnection);
    socket.listen(config.port, onListening);
    socket.on('error', onError);

    //------------------------------------------------------------------//
    
    function onListening(){
        self.emit('listening', config);
    };

    function onConnection(socket){
        self.emit('connection', new socks4Connection(socket, config));
    };

    function onError(){
    };

    return this;
};
require('util').inherits(socks4Listener, require('events').EventEmitter);

//////////////////////////////////////////////////////////////////////////////

module.exports = function(s){
    return new socks4Listener(s);
};



/* // Example code

var l = new socks4Listener();
l.on('connection', function(c){ c.on('request', function(x){

    var p = require('net').createConnection(x.port, x.target, function(){
        console.log('CONNECT - ' + x.target + ':' + x.port);
        if(c.connect) c.connect(p);
    });
    p.on('error', function(){
        console.log('REJECT - ' + x.target + ':' + x.port);
        if(c.reject) c.reject();
    });
    c.on('terminate', function(){
        try{
            p.end();
            p.destroy();
        } catch(e){
        };
    });

}) });

*/
