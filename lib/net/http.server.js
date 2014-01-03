var server = function(baum, port){
    var self = this;
    baum.nodejs.events.EventEmitter.call(this);
    var packet = require('./packet.js')(baum);

    var server = null;

    function serverLogic(request, response){
        self.emit('data', packet.createServerPacket('http', request, response));
    };

    this.start = function(){
        function initServer(){
            server = baum.nodejs.http.createServer(serverLogic);
            server.listen(port);
        };

        initServer();
    };

    return this;
};


module.exports = function(baum){
    baum.nodejs.util.inherits(server, baum.nodejs.events.EventEmitter);
    return new function(){
        var self = this;
        this.createServer = function(port){
            return new server(baum, port);
        };

        return this;
    };
};
