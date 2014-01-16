require('./lib/baum.js');

$.config = JSON.parse($.nodejs.fs.readFileSync('./config'));
$.streaming = require('./lib/streaming.js');
//////////////////////////////////////////////////////////////////////////////

// set up proxy
var mechanism = require('./lib/mechanism/__init__.js')(),
    proxy = require('./lib/proxy/__init__.js')();

if($.config.client){
    var proxyClient = proxy.client[$.config.client.proxy.select](),
        mechanismClient = mechanism.client[$.config.client.mechanism.select]()
    ;

    for(var key in $.config.client.proxy.config)
        proxyClient.configure(key, $.config.client.proxy.config[key]);
    for(var key in $.config.client.mechanism.config)
        mechanismClient.configure(key, $.config.client.mechanism.config[key]);

    mechanismClient.start();

    proxyClient.setMechanism(mechanismClient);
    proxyClient.start();
};

if($.config.server){
    var proxyServer = proxy.server[$.config.server.proxy.select](),
        mechanismServer = mechanism.server[$.config.server.mechanism.select]()
    ;

    for(var key in $.config.server.proxy.config)
        proxyServer.configure(key, $.config.server.proxy.config[key]);
    for(var key in $.config.server.mechanism.config)
        mechanismServer.configure(key, $.config.server.mechanism.config[key]);

    mechanismServer.start();

    proxyServer.setMechanism(mechanismServer);
    proxyServer.start();
};
