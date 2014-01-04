var server = $.socksv5(
    $.config['service-port'],
    //$.proxys.dummy,
    $.proxys.xmpp(process.argv[2], process.argv[3], process.argv[4]),
    $.analyzer
);

module.exports = server;
