function xmppTunnel($, xmpp, provider, id){
    $.nodejs.events.EventEmitter.call(this);
    var self = this;
    
    var connectSuccess;

    function send(data){
        data.id = id;
        xmpp.send(provider, JSON.stringify(data));
        console.log('DATA Sending to [', provider, ']: --------------\n', JSON.stringify(data), '\n-----------------');
    };

    this.handle = function(json){
        var res = json.res;
        switch(res){
            case 'connection':
                connectSuccess();
                self.emit('connection');
                break;
            case 'error':
                self.emit('error', json.err);
                break;
            case 'data':
                self.emit(
                    'data',
                    new $.nodejs.buffer.Buffer(json.data, 'base64')
                );
                break;
            case 'close':
            case 'end':
                self.emit(
                    'end',
                    new $.nodejs.buffer.Buffer(json.data, 'base64')
                );
                break;
            default:
                break;
        };
    };

    this.connect = function(port, addr, successCallback){
        console.log(String('Trying to connect ' + addr + ':' + port + ' via XMPP'), port, addr);
        connectSuccess = successCallback;
        send({
            cmd: 'connect',
            addr: addr,
            port: port,
        });
    };

    this.write = function(data){
        send({
            cmd: 'data',
            data: data.toString('base64'),
        });
    };

    this.close = function(){
        send({
            cmd: 'end',
            data: '',
        });
    };

    return this;
};

//////////////////////////////////////////////////////////////////////////////

function client(){
    var self = this;
    $.nodejs.events.EventEmitter.call(this);

    var configuration = {
            account: null,
            password: null,
            provider: null,
        },
        tunnels = {},
        xmpp
    ;

    xmpp.on('data', function(data){
        console.log('DATA Received from [', data.from, ']: --------------\n', data.content, '\n-----------------');
        try{
            var json = JSON.parse(data.content);
            if(undefined == tunnels[json.id]) return;
            tunnels[json.id].handle(json);
        } catch(e){
        };
    });

    /* define behaviours */
    this.configure = function(optionName, value){
        if(undefined != configuration[optionName]){
            configuration[optionName] = value;
            return self;
        } else
            return false;
    };

    this.start = function(){
        xmpp = new $.xmpp(configuration.account, configuration.password);
        xmpp.login(true);
    };

    this.getTunnel = function(){
        var id = process.hrtime().join('');
        var entrance = new xmppTunnel(xmpp, configuration.provider, id);
        tunnels[id] = entrance;
        return tunnels[id];
    };

    return this;
};

//////////////////////////////////////////////////////////////////////////////

module.exports = function(){
    $.nodejs.util.inherits(client, $.nodejs.events.EventEmitter);
    $.nodejs.util.inherits(xmppTunnelEntrance, $.nodejs.events.EventEmitter);

    return function(){
        return new client();
    };
};
