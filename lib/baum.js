$ = {
    nodejs: {
        fs: require('fs'),
        http: require('http'),
        events: require('events'),
        util: require('util'),
        url: require('url'),

        async: require('async'),
        httpProxy: require('http-proxy'),
    },

    config: {},
};

$.net = require('./net/__init__.js')($);
