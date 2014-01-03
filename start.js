require('./lib/baum.js');

$.config = JSON.parse($.nodejs.fs.readFileSync('./config'));
$.socksv5 = require('./lib/socksv5.js')($);
$.proxys = require('./lib/proxys.js')($);
//////////////////////////////////////////////////////////////////////////////

// set up proxy
var serverProxy = require('./core/server.proxy.js'),
    serverConfig = require('./core/server.config.js');
