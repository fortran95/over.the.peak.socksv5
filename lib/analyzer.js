function HTTPHeader(data){
    var str = data.toString();

    if(!/(GET|HEAD|POST|PUT|DELETE|TRACE|CONNECT)\s.+\sHTTP/.test(str)) return data;

    var lines = str.split('\r'), entries = {}, key, value, col;

    /* Re-order */
    for(var i=1; i<lines.length; i++){
        lines[i] = lines[i].trim();
        col = lines[i].indexOf(':');
        if(col < 0) continue;

        key = lines[i].substr(0, col).trim();
        value = lines[i].substr(col + 1).trim();

        switch(key.toLowerCase()){
            case 'user-agent':
                value = 'Mozilla/5.0';
                break;
            default:
                break;
        };

        entries[key] = value;
    };

    var newHeaderLines = [lines[0],], keys = Object.keys(entries).sort();
    for(var i in keys){
        newHeaderLines.push(keys[i] + ': ' + entries[keys[i]]);
    };
    newHeaderLines.push('\r\n');

    data = new $.nodejs.buffer.Buffer(newHeaderLines.join('\r\n'), 'ascii');

    console.log(data.toString());
    return data;
};

function analyzer($){
    var self = this;

    var session;

    this.sending = function(data, callback){
        data = HTTPHeader(data);
        callback(data);
    };

    this.receiving = function(data, callback){
        callback(data);
    };

    this.connected = function(s, addr, port){
        session = s;
    };

    return this;
};

module.exports = function($){
    return function(){
        return new analyzer($);
    };
};
