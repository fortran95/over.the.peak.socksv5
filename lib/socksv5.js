function localSession($, socket){
    var state = 0, functions;
    /*
     * -1   local socket close set.
     * 0    Not authenticated
     * 1    Sent back authenticate method.
     * 2    Reply sent.
     */
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
                break;
            default:
                console.log(data.toString());
                break;
        };
    };

    socket.on('data', handleData);

    socket.on('close', function(){
        state = -1;
    });

    socket.on('error', function(){
        state = -1;
        socket.destroy();
    });

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
                if(data.readInt8(0) != 5) return failRequest();  // VER == 5
                if(data.readInt8(1) != 1) return failRequest(7); // CMD, 1: CONNECT, 2: BIND 3: UDP ASSOCIATE
                if(data.readInt8(2) != 0) return failRequest();  // RSV == 0

                var addr = '', sliceEnd = data.length - 2;
                var addrData = data.slice(3, sliceEnd);

                switch(data.readInt8(3)){
                    case 1: // IP V4 ADDRESS
                        addr = [
                            addr.readInt8(0),
                            addr.readInt8(1),
                            addr.readInt8(2),
                            addr.readInt8(3)
                        ].join('.');
                        break;
                    case 3: // DOMAINNAME
                        addr = addrData.toString();
                        break;
                    case 4: // IP V6 ADDRESS
                    default:
                        return failRequest(8);  // Address type not supported.
                };

                var port = data.readInt16BE(data.length - 2);
                console.log(addr, port);

            } catch(e){
                return failRequest();
            };


            requestReply(0, data.slice(3));
            state = 2;
        },

        // @ state == 2:
        forward: function(data){
            
        },
    };
};

function server($, port){
    var self = this;

    var server = new $.nodejs.net.createServer(function(socket){
        localSession($, socket)
    });
    server.listen(port);

    return this;
};

module.exports = function($){
    return function(port){
        return new server($, port);
    };
};
