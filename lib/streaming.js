module.exports = function(){
    var self = this,
        outgoingListener, incomingListener
    ;

    self.outgoing = new $.nodejs.stream.Transform();
    self.incoming = new $.nodejs.stream.Transform();
    bindStream(self.outgoing, stream);
    bindStream(self.incoming, stream);

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
            listener.write(chunk);
        });

        transform.on('end', function(chunk){
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
    };

    this.configure = function(optionName, value){
    };

    return this;
};
