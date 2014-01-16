module.exports = function(addr, port, session){
    var self = this;
    
    this.url = function(url){
        for(var host in $.config.block){
            if(!(new RegExp(host).test(addr))) continue;

            var rule = $.config.block[host];
            if(true === rule) return rule;

        };
        return false;
    };

    this.addr = function(){
        for(var host in $.config.block){
            if(!(new RegExp(host).test(addr))) continue;
            if(true === $.config.block[host]) return true;
        };
        return false;
    };

    return this;
};
