var server = $.nodejs.http.createServer(function(req, res){
    res.end('You have hit the configuration panel.');
});

// start server
server.listen($.config['manage-port']);

module.exports = server;
