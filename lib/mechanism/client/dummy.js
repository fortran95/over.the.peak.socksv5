function dummy(streaming){
    var self = this;

    streaming.listenOutgoingStream(self);

    var socket = new $.nodejs.net.Socket(),
        closed = false;

    socket.on('data', function(data){
        if(closed) return;
        streaming.incoming.write(data);
    });

    socket.on('end', function(data){
        if(closed) return;
        streaming.incoming.end(data);
    });
    socket.on('error', function(e){
        if(closed) return;
        closed = true;
        streaming.close();
        socket.destroy();
    });
    socket.on('close', function(){
        if(closed) return;
        closed = true;
        streaming.close();
    });


    this.connect = function(parameters){
        var port = parameters.port,
            addr = parameters.addr;

        console.log(String('Trying to connect ' + addr + ':' + port + ' directly via a TCP socket.'), port, addr);
        socket.connect(parseInt(port), addr, function(err){
            if(null != err){
                closed = true;
                return streaming.close();
            } else {
                streaming.connectIncomingStream();
            };
        });
    };

    this.end = function(data){
        socket.end(data);
    };

    this.write = function(data){
        socket.write(data);
    };

    this.close = function(){
        try{
            socket.end();
        } catch(e){
            socket.destroy();
        };
    };

    return this;
};


//////////////////////////////////////////////////////////////////////////////

function client(){
    var self = this;
    var configuration = {};

    /* define behaviours */
    this.configure = function(optionName, value){
        if(undefined !== configuration[optionName]){
            configuration[optionName] = value;
            return self;
        } else
            return false;
    };

    this.start = function(){
    };

    this.handle = function(streaming){
        new dummy(streaming);
    };

    return this;
};

//////////////////////////////////////////////////////////////////////////////

module.exports = function(){
    return function(){
        return new client();
    };
};
