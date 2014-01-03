var server = $.nodejs.httpProxy.createServer(function(req, res, proxy){
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

    res.write(JSON.stringify(req.headers));
    res.end('The proxy is up and running. Currently it have no ability to proxy your request further.');
});

// start server
server.listen($.config['service-port']);

module.exports = server;
