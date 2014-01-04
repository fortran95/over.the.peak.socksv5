var dummy = require('./proxys.dummy.js'),
    xmpp = require('./proxys.xmpp.js');
//////////////////////////////////////////////////////////////////////////////
function proxy($, worker){
    $.nodejs.events.EventEmitter.call(this);
    var self = this;

    var connected = false;
    
    worker.on('close', function(){
        self.emit('close');
        connected = false;
    });
    worker.on('data', function(data){self.emit('data', data);});
    worker.on('end', function(data){
        self.emit('end', data);
        connected = false;
    });

    this.close = function(){
        worker.close();
        connected = false;
    };

    this.establish = function(addr, port, success, fail){
        worker.connect(port, addr, function(){
            connected = true;
            success();
        });
        worker.on('error', function(e){
            connected = false;
            console.log(e);
            self.emit('error', e);
            fail();
        });
    };

    this.write = function(data){
        if(!connected) console.log('WARNING! NOT CONNECTED.');
        if(connected)
            worker.write(data);
        else
            console.log('ABOVE IS NOT SENT.');
    };

    return this;
};

module.exports = function($){
    $.nodejs.util.inherits(dummy, $.nodejs.events.EventEmitter);
    $.nodejs.util.inherits(proxy, $.nodejs.events.EventEmitter);
    
    var self = this;

    this.dummy = function(){
        var agent = new dummy($);
        return new proxy($, agent);
    };

    this.xmpp = function(account, password, provider){
        var constructor = xmpp(account, password, provider)($);
        return function(){
            var agent = new constructor();
            return new proxy($, agent);
        };
    };

    return this;
};
