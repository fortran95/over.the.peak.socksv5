module.exports = function(baum){
    return new function(){
        var self = this;

        var httpServer = require('./http.server.js')(baum),
            urlRouter = require('./router.js')(baum);

        this.HTTP = {
            server: httpServer.createServer,
        };

        this.urlRouter = urlRouter;

        return this;
    };
};
