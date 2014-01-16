function SocksV5(addr, port, streaming){
    var self = this;

    streaming.listenOutgoingStream(self);
    var socket = new $.nodejs.net.Socket({
        fd: null,
        allowHalfOpen: false,
        readable: true,
        writable: true,
    });

    /*
     * -1 - closed
     *  0 - default
     *  1 - connect, before sending handshake
     *  2 - handshaked, before sending request of connection
     *  3 - request sent, waiting for reply
     *  4 - fully established
     */
    var state = 0, connectFunc;

    //////////////////////////////////////////////////////////////////////

    /* define logic handler */
    function socketClose(){
        if(state < 0) return;
        state = -1;
        streaming.close();
        socket.destroy();
    };

    function socketSendSocksV5Connection(destAddr, destPort){
        // send a connection request
        var portStr = parseInt(destPort).toString(16);
        portStr = '0000'.substr(portStr.length) + portStr;

        var addrType = (
            (/^[0-9]{1,3}(\.[0-9]{1,3}){3}$/.test(destAddr))?'01':'03'
        );
        
        var addrRepr = '';
        if('01' == addrType){
            addrRepr = new $.nodejs.buffer.Buffer(destAddr.split('.'));
        } else {
            addrRepr = new $.nodejs.buffer.Buffer(destAddr, 'ascii');
        };

        var writing = $.nodejs.buffer.Buffer.concat([
            new $.nodejs.buffer.Buffer('050100', 'hex'),
            new $.nodejs.buffer.Buffer(addrType, 'hex'),
            addrRepr,
            new $.nodejs.buffer.Buffer(portStr, 'hex'),
        ]);

        socket.write(writing);
        state = 3;
    };

    socket.on('data', function(data){
        if(1 == state){
            if(5 == data.readUInt8(0) && 0 == data.readUInt8(1)){
                // send connection request
                state = 2;
                connectFunc();
            } else {
                socketClose();
            };
            return;
        };

        if(3 == state){
            if(5 == data.readUInt8(0) && 0 == data.readUInt8(1)){
                state = 4;
            } else {
                console.log('Connect to SocksV5 Service not established.');
                socketClose();
            };
            return;
        };

        if(4 == state){
            streaming.incoming.write(data);
        };
    });

    socket.on('end', function(data){
        if(4 == state)
            streaming.incoming.end(data);
    });

    socket.on('error', socketClose);
    socket.on('close', socketClose);

    //////////////////////////////////////////////////////////////////////

    /* handle outgoing stream */
    this.connect = function(parameters){
        if(0 != state) return;

        var destAddr = parameters.addr,
            destPort = parameters.port;

        connectFunc = (function(destAddr, destPort){
            return function(){
                socketSendSocksV5Connection(destAddr, destPort);
            };
        })(destAdder, destPort);

        socket.connect(port, addr, function(){
            // send authentication handshake 
            socket.write(new $.nodejs.buffer.Buffer('050101', 'hex'));
            state = 1;
        });
    };

    this.write = function(data){
        if(state < 4) return;
        socket.write(data);
    };

    this.end = function(data){
        if(state < 4) return;
        socket.end(data);
    };

    this.close = function(data){
        socketClose();
    };

    return this;
};

//////////////////////////////////////////////////////////////////////////////

function server(){
    var self = this;

    var configuration = {
        port: null,
        addr: null,
    };

    this.handle = function(streaming){
        new SocksV5(configuration.addr, configuration.port, streaming);
    };

    this.start = function(){
    };

    this.configure = function(optionName, value){
        if(undefined !== configuration[optionName]){
            configuration[optionName] = value;
            return self;
        } else
            return false;
    };

    return this;
};

//////////////////////////////////////////////////////////////////////////////

module.exports = function(){
    return function(){
        return new server();
    };
};
