/*function getSenderStream(stream){
    var compressStream = new $.nodejs.zlib.createDeflateRaw();
    stream.pipe(compressStream);
    stream.on('data', function(){
        compressStream.flush();
    });
    stream.on('end', function(){
        compressStream.flush();
    });
    return compressStream;
};

function getReceiverStream(stream){
    var compressStream = new $.nodejs.zlib.createInflateRaw();
    stream.pipe(compressStream);
    stream.on('data', function(){
        compressStream.flush();
    });
    stream.on('end', function(){
        compressStream.flush();
    });
    return compressStream;
};*/

module.exports = function(role){
    var self = this,
        outgoingListener, incomingListener,
        _outgoing, _incoming,
        closed = false
    ;

    self.outgoing = new $.nodejs.stream.PassThrough();
    self.incoming = new $.nodejs.stream.PassThrough();

/*    if('sender' == role){
        _outgoing = getSenderStream(self.outgoing);
        _incoming = getReceiverStream(self.incoming);
    } else {
        _outgoing = getReceiverStream(self.outgoing);
        _incoming = getSenderStream(self.incoming);
    };*/

    function bindListener(transform, listener){
        /*
         * so we require a listener must have following methods:
         *  - close
         *  - write
         *  - end
         *  - connect
         */
        transform.on('close', function(){
            listener.close();
        });

        transform.on('error', function(){
            listener.close();
        });

        transform.on('data', function(chunk){
            if(!closed)
                listener.write(chunk);
        });

        transform.on('end', function(chunk){
            if(!closed)
                listener.end(chunk);
        });
    };

    this.listenOutgoingStream = function(listener){
        outgoingListener = listener;
        bindListener(self.outgoing, outgoingListener);
    };

    this.listenIncomingStream = function(listener){
        incomingListener = listener;
        bindListener(self.incoming, incomingListener);
    };

    this.connectOutgoingStream = function(parameters){
        outgoingListener.connect(parameters);
    };

    this.connectIncomingStream = function(){
        incomingListener.connect();
    };

    this.close = function(){
        if(!closed){
            incomingListener.close();
            outgoingListener.close();
            closed = true;
        };
    };

    this.configure = function(optionName, value){
    };

    return this;
};
