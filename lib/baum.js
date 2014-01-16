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

        async: require('async'),
        xmpp: require('node-xmpp'),
    },

    config: {},
};

$.net = require('./net/__init__.js')($);
$.socksv5 = require('./socksv5.js')($);
$.proxys = require('./proxys.js')($);
$.analyzer = require('./analyzer.js')($);
$.xmpp = require('./xmpp.js')($);
