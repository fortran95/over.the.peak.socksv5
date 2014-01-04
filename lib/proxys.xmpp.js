function xmppTunnelEntrance($, xmpp, provider, id){
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
                    new $.nodejs.buffer.Buffer(json.data, 'hex')
                );
                break;
            case 'close':
            case 'end':
                self.emit(
                    'end',
                    new $.nodejs.buffer.Buffer(json.data, 'hex')
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
            data: data.toString('hex'),
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

module.exports = function(account, password, provider){
    return function($){
        $.nodejs.util.inherits(
            xmppTunnelEntrance,
            $.nodejs.events.EventEmitter
        );
        
        var tunnels = {};
        var xmpp = new $.xmpp(account, password);
        xmpp.login(true);

        xmpp.on('data', function(data){
            console.log('DATA Received from [', data.from, ']: --------------\n', data.content, '\n-----------------');
            try{
                var json = JSON.parse(data.content);
                if(undefined == tunnels[json.id]) return;
                tunnels[json.id].handle(json);
            } catch(e){
            };
        });

        return function(){
            var id = process.hrtime().join('');
            var entrance = new xmppTunnelEntrance($, xmpp, provider, id);
            tunnels[id] = entrance;
            return tunnels[id];
        };
    };
};
