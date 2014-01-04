module.exports = function($){
    $.nodejs.events.EventEmitter.call(this);
    var self = this;

    var socket = new $.nodejs.net.Socket();

    socket.on('data', function(data){
        self.emit('data', data);
    });

    socket.on('end', function(data){
        self.emit('end', data);
    });
    socket.on('error', function(e){
        self.emit('error', e);
        socket.destroy();
    });
    socket.on('close', function(){
        self.emit('close');
    });


    this.connect = function(port, addr, successCallback){
        console.log(String('Trying to connect ' + addr + ':' + port + ' directly via a TCP socket.'), port, addr);
        socket.connect(parseInt(port), addr, successCallback);
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
