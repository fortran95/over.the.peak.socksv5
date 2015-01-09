require('./lib/baum.js');

$.config = JSON.parse($.nodejs.fs.readFileSync('./config'));
$.streaming = require('./lib/streaming.js');
//////////////////////////////////////////////////////////////////////////////

// set up proxy
var mechanism = {
        server: {
            XMPP: require('./lib/mechanism/server/xmpp.js')(),
        },
        client: {
            dummy: require('./lib/mechanism/client/dummy.js')(),
            XMPP: require('./lib/mechanism/client/xmpp.js')(),
        },
    },
    proxy = {
        server: {
            dummy: require('./lib/proxy/server/dummy.js')(),
            SocksV5: require('./lib/proxy/server/socksv5.js')(),
        },
        client: {
            SocksV5: require('./lib/proxy/client/socksv5.js')(),
        }
    }
;

if($.config.client){
    var proxyClient = new proxy.client[$.config.client.proxy.select](),
        mechanismClient = new mechanism.client[$.config.client.mechanism.select]()
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
    var proxyServer = new proxy.server[$.config.server.proxy.select](),
        mechanismServer = new mechanism.server[$.config.server.mechanism.select]()
    ;

    for(var key in $.config.server.proxy.config)
        proxyServer.configure(key, $.config.server.proxy.config[key]);
    for(var key in $.config.server.mechanism.config)
        mechanismServer.configure(key, $.config.server.mechanism.config[key]);

    proxyServer.start();

    mechanismServer.setProxy(proxyServer);
    mechanismServer.start();
};
