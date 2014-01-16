function xmppTunnel(xmpp, provider, id, streaming){
    var self = this;
    
    var connectSuccess, closed = false;

    streaming.listenOutgoingStream(self);

    function send(data){
        data.id = id;
        xmpp.send(provider, JSON.stringify(data));
        console.log('DATA Sending to [', provider, ']: --------------\n', JSON.stringify(data), '\n-----------------');
    };

    this.handle = function(json){
        var res = json.res;
        switch(res){
            case 'connection':
                streaming.connectIncomingStream();
                break;
            case 'error':
                streaming.close();
                break;
            case 'data':
                streaming.incoming.write(
                    new $.nodejs.buffer.Buffer(json.data, 'base64')
                );
                break;
            case 'close':
            case 'end':
                streaming.incoming.write(
                    new $.nodejs.buffer.Buffer(json.data, 'base64')
                );
                streaming.close();
                break;
            default:
                break;
        };
    };


    /* Handle the Outgoing Stream */
    this.connect = function(parameters){
        var port = parameters.port,
            addr = parameters.addr;
        console.log(String('Trying to connect ' + addr + ':' + port + ' via XMPP'), port, addr);
        send({
            cmd: 'connect',
            addr: addr,
            port: port,
        });
    };

    this.write = function(data){
        if(closed) return;
        send({
            cmd: 'data',
            data: data.toString('base64'),
        });
    };

    this.close = function(){
        if(closed) return;
        send({
            cmd: 'end',
            data: '',
        });
        closed = true;
    };

    this.end = function(data){
        if(closed) return;
        send({
            cmd: 'end',
            data: data.toString('base64'),
        });
    };

    return this;
};

//////////////////////////////////////////////////////////////////////////////

function client(){
    var self = this;
    var configuration = {
            account: null,
            password: null,
            provider: null,
        },
        tunnels = {},
        xmpp
    ;

    /* define behaviours */
    this.configure = function(optionName, value){
        if(undefined !== configuration[optionName]){
            configuration[optionName] = value;
            return self;
        } else
            return false;
    };

    this.start = function(){
        xmpp = new $.xmpp(configuration.account, configuration.password);
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
    };

    this.handle = function(streaming){
        var id = process.hrtime().join('');
        var entrance = new xmppTunnel(
            xmpp,
            configuration.provider,
            id,
            streaming
        );
        tunnels[id] = entrance;
        return tunnels[id];
    };

    return this;
};

//////////////////////////////////////////////////////////////////////////////

module.exports = function(){
    return function(){
        return new client();
    };
};
