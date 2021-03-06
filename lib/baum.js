$ = {
    nodejs: {
        fs: require('fs'),
        http: require('http'),
        events: require('events'),
        util: require('util'),
        url: require('url'),
        net: require('net'),
        buffer: require('buffer'),
        stream: require('stream'),
        zlib: require('zlib'),

        async: require('async'),
        xmpp: require('node-xmpp'),
    },

    config: {},
};

$.net = require('./net/__init__.js')($);
$.xmpp = require('./xmpp.js')($);

/*
$.socksv5 = require('./socksv5.js')($);
$.proxys = require('./proxys.js')($);
$.analyzer = require('./analyzer.js')($);
*/
