var server = $.socksv5(
    $.config['service-port'],
    $.proxys.dummy
);

module.exports = server;
