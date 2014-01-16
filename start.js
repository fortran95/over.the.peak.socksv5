require('./lib/baum.js');

$.config = JSON.parse($.nodejs.fs.readFileSync('./config'));
$.streaming = require('./lib/streaming.js');
//////////////////////////////////////////////////////////////////////////////

// set up proxy
var serverProxy = require('./core/server.proxy.js'),
    serverConfig = require('./core/server.config.js');
