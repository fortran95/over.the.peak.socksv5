function socks4Socket(socket, config){
    var self = this;
    require('events').EventEmitter.call(this);

    var buffer = require('buffer');

    var stat = {
        handshook: false,
        terminated: false,
    };

    function doRejection(){
        if(stat.terminated) return;
        try{
            socket.end(new buffer.Buffer([0, 91, 0, 0, 0, 0, 0, 0]));
        } catch(e){
        };
    };

    function onHandshake(dataBuf){
        if(dataBuf.length < 8) return doRejection();
        if(4 != dataBuf[0]) return doRejection();
        if(1 != dataBuf[1]) return doRejection(); // not supporting BIND

        console.log(dataBuf)

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
            if(/^([0-9]{1,3}\.){4}$/.test(target + '.'))
                type = 'ip';
            else
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
        
        console.log(type, target, port)
    };

    socket.on('data', function(dataBuf){
        if(stat.terminated) return;
        if(!stat.handshook) return onHandshake(dataBuf);
    });

    socket.on('error', function(){
        stat.terminated = true;
        // TODO terminate 
    });

    return this;
};
require('util').inherits(socks4Socket, require('events').EventEmitter);


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
        self.emit('local.listening', config);
    };

    function onConnection(socket){
        self.emit('local.connection');
        new socks4Socket(socket, config);
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

new socks4Listener();
