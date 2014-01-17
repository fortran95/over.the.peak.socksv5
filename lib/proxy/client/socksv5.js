//////////////////////////////////////////////////////////////////////////////
function SocksV5(socket){
    var self = this;
    var state = 0, functions, streaming = new $.streaming('sender');
    /*
     * -1   local socket close set.
     * 0    Not authenticated
     * 1    Sent back authenticate method.
     * 2    Reply sent.
     */
    streaming.listenIncomingStream(self);
    
    function answer(str){
        if(state < 0) return;
        socket.write(new $.nodejs.buffer.Buffer(str), 'ascii');
    };
    
    function requestReply(REP, ADDR){
        /*
         *  REP value meanings(RFC 1928): 
         *   o  X'00' succeeded
         *   o  X'01' general SOCKS server failure
         *   o  X'02' connection not allowed by ruleset
         *   o  X'03' Network unreachable
         *   o  X'04' Host unreachable
         *   o  X'05' Connection refused
         *   o  X'06' TTL expired
         *   o  X'07' Command not supported
         *   o  X'08' Address type not supported
         *   o  X'09' to X'FF' unassigned
         */
        answer(
            '\x05' + 
            String.fromCharCode(REP) +
            '\x00' +
            ADDR.toString('ascii')
        );
    };

    /* bind socket and proxy stream */
    function handleData(data){
        switch(state){
            case 0:
                functions.authenticate();
                break;
            case 1:
                functions.processRequest(data);
                break;
            case 2:
                functions.forward(data);
                break;
            case -1:
            default:
                console.log(data.toString());
                break;
        };
    };
    socket.on('data', handleData);
    socket.on('close', function(){
        streaming.close();
        state = -1;
    });
    socket.on('error', function(){
        state = -1;
        streaming.close();
        socket.destroy();
    });

    /* define logic */
    functions = {
        // @ state == 0:
        authenticate: function(){
            answer('\x05\x00');
            state = 1;
        },

        // @ state == 1:
        processRequest: function(data){
            function failRequest(reason, addr){
                if(undefined == reason) reason = 1;
                if(undefined == addr) addr = data.slice(3);
                requestReply(reason, addr);
                socket.end();
                state = -1;
            };

            try{
                if(data.readUInt8(0) != 5) 
                    return failRequest();  // VER == 5
                if(data.readUInt8(1) != 1){ 
                    console.log('XX Unable to accept this type of CMD:', data.readUInt8(1));
                    return failRequest(7); // CMD, 1: CONNECT, 2: BIND 3: UDP ASSOCIATE
                };
                if(data.readUInt8(2) != 0)
                    return failRequest();  // RSV == 0

                var addr = '', sliceEnd = data.length - 2;
                var addrData = data.slice(4, sliceEnd);

                switch(data.readUInt8(3)){
                    case 1: // IP V4 ADDRESS
                        addr = [
                            addrData.readUInt8(0),
                            addrData.readUInt8(1),
                            addrData.readUInt8(2),
                            addrData.readUInt8(3)
                        ].join('.');
                        break;
                    case 3: // DOMAINNAME
                        addr = addrData.slice(1).toString('ascii');
                        break;
                    case 4: // IP V6 ADDRESS
                    default:
                        return failRequest(8);  // Address type not supported.
                };

                var port = data.readUInt16BE(data.length - 2);
            } catch(e){
                console.log('ERROR', e);
                return failRequest();
            };

            console.log('Connecting to', addr, ':', port, '...');
            // put things forward.
            functions.establish(addr, port);
            self.connect = function(){
                console.log('CONNECTION ESTABLISHED.');
                requestReply(0, data.slice(3));
                state = 2;
            };
            
            // end of function
        },

        establish: function(addr, port){
            console.log("## request", addr, ':', port);
            streaming.connectOutgoingStream({
                addr: addr,
                port: port
            });
        },

        // @ state == 2:
        forward: function(data){
            streaming.outgoing.write(data);
        },
    };


    /* Handle the incoming stream */
    this.write = function(data){
        if(state < 2) return;
        socket.write(data);
    };

    this.end = function(data){
        if(state < 2) return;
        socket.end(data);
        state = -1;
    };

    this.close = function(){
        try{
            socket.destroy();
            streaming.close();
            state = -1;
        } catch(e){
            socket.destroy();
        };
    };

    return streaming;
};

//////////////////////////////////////////////////////////////////////////////

function client(){
    $.nodejs.events.EventEmitter.call(this);
    var self = this;

    var configuration = {
            'port': 8119,
        },
        mechanism = null,
        analyzer = null
    ;

    /* This is in fact a server, but we would like to distinguish it with
     * the concept of 'proxy client' and not even worse mix it up with
     * 'proxy server'. */
    var listener = new $.nodejs.net.createServer(function(socket){
        var streaming = new SocksV5(socket);
        mechanism.handle(streaming);
    });


    /* define behaviours */
    this.configure = function(optionName, value){
        if(undefined !== configuration[optionName]){
            configuration[optionName] = value;
            return self;
        } else
            return false;
    };

    this.start = function(){
        if(null == mechanism)
            return self.emit('error', 'mechanism-client-required');
        console.log('Setting local proxy client at port:', configuration.port);
        listener.listen(configuration.port);
    };

    this.setMechanism = function(mechanismObject){
        mechanism = mechanismObject;
        delete self.setMechanism;
    };

    this.setAnalyzer = function(analyzerObject){
        analyzer = analyzerObject;
        delete self.setAnalyzer;
    };

    return this;
};

//////////////////////////////////////////////////////////////////////////////

module.exports = function(){
    $.nodejs.util.inherits(client, $.nodejs.events.EventEmitter);

    return function(){
        return new client();
    };
};
