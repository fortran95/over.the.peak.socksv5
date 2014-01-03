function dummy($){
    $.nodejs.events.EventEmitter.call(this);
    var self = this;

    this.connect = function(port, addr, successCallback){
        successCallback();
    };

    this.write = function(data){
        self.emit(
            'data', 
            new $.nodejs.buffer.Buffer(
                '200 OK\r\n\r\n' + 
                data.toString('hex'), 
                'ascii'
            )
        );

        self.emit('end');
    };

    return this;
};

//////////////////////////////////////////////////////////////////////////////
function proxy($, worker){
    $.nodejs.events.EventEmitter.call(this);
    var self = this;
    
    worker.on('error', function(){self.emit('error');});
    worker.on('close', function(){self.emit('close');});
    worker.on('data', function(data){
        self.emit('data', data);
    });
    worker.on('end', function(data){
        self.emit('end', data);
    });

    this.establish = function(addr, port, success, fail){
        worker.connect(port, addr, function(){
            success();
        });
    };

    this.write = function(data){
        worker.write(data);
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

    return this;
};
