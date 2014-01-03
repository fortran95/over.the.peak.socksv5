function logic(req, res, proxy){
    var buffer = $.nodejs.httpProxy.buffer(req),
        url = $.nodejs.url.parse(req.url);

    console.log(url.href);

    // access to control panel
    if(
        'over.the.peak' == url.hostname &&
        true == $.config['web-access-control-panel']
    ){
        proxy.proxyRequest(req, res, {
            host: '127.0.0.1',
            port: $.config['manage-port'],
            buffer: buffer,
        });
        return;
    };

    // do a series of logic.
    var task = [
        function(callback){
            if(url.href.indexOf('.png') >= 0) callback(true);
            callback(null);
        },
    ];

    $.nodejs.async.series(task, function(err, taskResult){
        if(null == err){
            proxy.proxyRequest(req, res, {
                host: url.hostname,
                port: url.port || 80,
                buffer: buffer,
            });
            return;
        };

        res.end('Proxy refused to serve this request.');
    });
};

//////////////////////////////////////////////////////////////////////////////
var server = $.nodejs.httpProxy.createServer(logic);

// start server
server.listen($.config['service-port']);
module.exports = server;
