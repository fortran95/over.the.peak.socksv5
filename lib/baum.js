$ = {
    nodejs: {
        fs: require('fs'),
        http: require('http'),
        events: require('events'),
        util: require('util'),
        url: require('url'),
        net: require('net'),
        buffer: require('buffer'),

        async: require('async'),
        httpProxy: require('http-proxy'),
    },

    config: {},
};

$.net = require('./net/__init__.js')($);
