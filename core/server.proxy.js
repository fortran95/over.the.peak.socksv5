var server = $.socksv5(
    $.config['service-port'],
    $.proxys.dummy,
    $.analyzer
);

module.exports = server;
