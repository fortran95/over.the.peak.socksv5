var server = $.socksv5(
    $.config['service-port'],
    $.proxys.dummy, // $.proxys.xmpp('username', '******')
    $.analyzer
);

module.exports = server;
