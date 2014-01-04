/*
 * a XMPP client
 */

function xmppClient($, jid, password){
    $.nodejs.events.EventEmitter.call(this);
    var self = this;

    this._autoReconnect = false;
    this._password = false;
    this._initPresence = true;
    this.client = null;
    this.queue = new x.storage.queue();

    this.clientStatus = function(v){
        /* see <https://github.com/astro/node-xmpp/blob/master/lib/xmpp/client.js> */
        var res = 'PREAUTH';
        if(self.client)
            res = {
                0: 'PREAUTH',
                1: 'AUTH',
                2: 'AUTHED',
                3: 'BIND',
                4: 'SESSION',
                5: 'ONLINE',
            }[self.client.state];

        if(v == undefined)
            return res;
        else
            return res == v || self.client.state == v;
    };

    this.loggedIn = function(){
        if(self.client)
            return self.client.state >= 2;
        return false;
    };

    this.logout = function(){
        if(!self.loggedIn()) return;
        self.client.end();
        self._autoReconnect = false;
    };

    this.kill = function(){
        /*
         * Forced Restart Sequence
         *
         * This will destory the client, and try to login.
         */
        try{
            if(self.client){
                self.client.connection.socket.destroy();
                delete self.client;

                if(self._autoReconnect){
                    self.login(self._password);
                }
            }
        } finally {
        }
    };

    this.login = function(presence){
        if(self.clientStatus() > 0) return false;
        if(password == undefined) password = self._password;
        if(!password) return false;

        self._autoReconnect = true;
        self._password = password;
        if(presence != undefined)
            self._initPresence = presence; //TODO validate 'presence', must contain valid 'chat' and 'words' item.
        else
            self._initPresence = true;

        self.client =
            new $.nodejs.xmpp.Client({
                jid: jid,
                password: password,
            })
        ;

        self.client.on('online', self.handlers.onOnline);
        self.client.on('stanza', self.handlers.onStanza);
        self.client.on('error', self.handlers.onError);
        self.client.on('close', self.handlers.onClose);

        self.client.connection.socket.setTimeout(
            10000,
            self.handlers.onTimeout
        );

        self.watchdog.wake();
        self.autoPinger();

        return true;
    };

    this.send = function(jid, content){
        /*
         * Send an Element
         * if not login, this will be put into queue.
         */
        if(content == undefined) return false;
        var element = 
            new $.nodejs.xmpp.Element(
                'message',
                {
                    to: jid,
                    type: 'chat'
                }
            )
                .c('body')
                .t(content)
        ;
        if(self.loggedIn())
            self.client.send(element);
        else
            self.queue.send(element);
        return true;
    };

    this.receive = function(){
        // Get receive queue
        if(!self.loggedIn()) return false;
        return self.queue.receive();
    };

    this.ping = function(jid){
        var stanzaID = '';
        if(!self.loggedIn()) return false;

        if(jid == undefined){
            jid = self.client.jid.bare();
            stanzaID = 'c2s1';
        } else {
            stanzaID = 'e2e1';
        }

        var stanza = new $.nodejs.xmpp.Element(
            'iq',
            {
                from: self.client.jid,
                to: jid,
                type: 'get',
                id: stanzaID,
            }
        )
            .c('ping')
            .attr('xmlns', 'urn:xmpp:ping')
            .root()
        ;

        self.client.send(stanza);

        return true;
    };

    this.autoPinger = function(){
        /*
         * Once called, will use setTimeout to generate PING every 20 sec.
         */
        self.ping();// to Server

        if(self.client)
            setTimeout(self.autoPinger, 20000);
    };

    this.sendPresence = function(show, words){
        if(!self.loggedIn()) return false;
        if(show == undefined) show = 'chat';
        if(words == undefined) words = 'OverThePeak System';

        self.client
            .send(
                new $.nodejs.xmpp
                    .Element('presence', { })
                    .c('show')
                    .t(show)
                    .up()
                    .c('status')
                    .t(words)
            )
        ;
    };

    this.handlers = {

        onOnline: function(){
            /* Request Roster. */
            self.client
                .send(
                    new $.nodejs.xmpp.Element(
                        'iq', {
                            from: self.client.jid,
                            type: 'get',
                            id: 'roster_1',
                        }
                    )
                        .c('query')
                        .attr('xmlns', 'jabber:iq:roster')
                        .root()
                )
            ;

            /* Purge send queue. */
            while(self.queue.countSend() > 0)
                self.client.send(self.queue.send());
        },

        onStanza: function(stanza){
            self.watchdog.feed();
            stanza = stanza.root();

            /*
             * Use self.xmppParser to parse stanza.
             * Here is the router.
             */
            if(
                stanza.is('message') &&
                stanza.attrs.type !== 'error'
            )
                self.xmppParser.message(stanza);

            if(stanza.is('iq')){
                try{
                    var queryStanza = stanza.getChild('query');
                    if(queryStanza){
                        if(queryStanza.attrs.xmlns == 'jabber:iq:roster'){
                            self.xmppParser.roster(queryStanza);
                            /* send presence if not done that. */
                            if(self._initPresence){
                                if(true === self._initPresence)
                                    self.sendPresence();
                                else
                                    self.sendPresence(
                                        self._initPresence.chat,
                                        self._initPresence.words
                                    );
                                self._initPresence = false;
                            }
                        }
                    }
                } catch (e){
                }
            }
            /* end of router */

        },

        onError: function(e){
            if(self.clientStatus('AUTH')){
                // failure to login.
                if(e.toString().indexOf('auth') >= 0){
                    // Login failure.
                    self._password = false;
                    self._autoReconnect = false;
                }
                // Attach self destory sequence.
                self.kill();
            }
        },

        onClose: function(e){
            console.log('Close received.');
        },

    }; // handlers: ...

    this.watchdog = {

        _lastTime: 0,
        patience: 30000,

        wake: function(){
            self.watchdog.feed();
            self.watchdog.hungry();
        },

        feed: function(){
            self.watchdog._lastTime = new Date().getTime();
        },

        hungry: function(){
            var nowtime = new Date().getTime();
            if(nowtime - self.watchdog._lastTime > self.watchdog.patience)
                if(self.loggedIn()){
                    self.kill();
                    console.log('Watchdog shutdown client!');
                }

            if(self.client)
                setTimeout(self.watchdog.hungry, 1000);
        },

    }

    this.xmppParser = {

        message: function(stanza){
            var body = stanza.getChild('body');
            if(body != undefined){
                var newMessage = {
                    'content': body.children.join(''),
                    'from': stanza.attrs.from,
                };
                self.queue.receive(newMessage);
            }
        },

    };

};


module.exports = function($){
    $.nodejs.util.inherits(xmppClient, $.nodejs.events.EventEmitter);
    return function(JID, password){
        return new xmppClient($, JID, password);
    };
}
