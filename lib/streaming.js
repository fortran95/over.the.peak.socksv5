module.exports = function(){
    var self = this,
        outgoingListener, incomingListener,
        closed = false
    ;

    self.outgoing = new $.nodejs.stream.PassThrough();
    self.incoming = new $.nodejs.stream.PassThrough();

    function bindListener(transform, listener){
        /*
         * so we require a listener must have following methods:
         *  - close
         *  - write
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
