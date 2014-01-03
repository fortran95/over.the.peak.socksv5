function clientPacket(baum, protocol, response){
    baum.nodejs.events.EventEmitter.call(this);
    var self = this;

    this.data = {raw: '', parsed: ''};

    this.response = response;
    this.response.on('data', function(chunk){
        if(
            self.data.raw.length + chunk.length > 1048567
        ){
            try{
                self.response.socket.destory();
            } catch(e){
            };
            self.response.end();
        } else
            self.data.raw += chunk;
    });
    this.response.on('end', function(){
        try{
            self.data.parsed = 
                baum.nodejs.querystring.parse(self.data.raw);
        } catch(e) {
            self.data.parsed = null;
        };
        self.addListener('newListener', function(e, listener){
            if(e == 'ready')
                listener(self.data);
        });
        self.emit('ready', self.data);
    });

    return this;
};

function serverPacket(baum, protocol, request, response){
    baum.nodejs.events.EventEmitter.call(this);
    var self = this;

    this.request = request;
    this.response = response;

    this.url = baum.nodejs.url.parse(this.request.url);
    this.url.protocol = protocol;
    this.protocol = protocol;

    this.write = function(p1, p2){
        self.response.write(p1, p2);
    };

    this.end = function(p){
        self.response.end(p);
    };

    this.method = this.request.method.toLowerCase();
    this.post = {raw: '', parsed: ''};

    /* Bind events to receive the posting data automatically. */
    if(this.method == 'post'){
        this.request.on('data', function(chunk){
            if(
                self.post.raw.length + chunk.length > 1048567
            ){
                try{
                    self.request.socket.destory();
                } catch(e){
                };
                self.request.end();
            } else
                self.post.raw += chunk;
        });
        this.request.on('end', function(){
            self.post.parsed = 
                baum.nodejs.querystring.parse(self.post.raw.trim());
            self.addListener('newListener', function(e, listener){
                if(e == 'ready')
                    listener(self.post);
            });
            self.emit('ready', self.post);
        });
    };

    return this;
};

module.exports = function(baum){
    baum.nodejs.util.inherits(serverPacket, baum.nodejs.events.EventEmitter);
    baum.nodejs.util.inherits(clientPacket, baum.nodejs.events.EventEmitter);
    return new function(){
        this.createServerPacket = function(protocol, req, resp){
            return new serverPacket(baum, protocol, req, resp);
        };
        this.createClientPacket = function(protocol, resp){
            return new clientPacket(baum, protocol, resp);
        };
        return this;
    };
};
