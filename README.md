Over the Peak
=============
This intends to implement another Socksv5 proxy using NodeJS. Planning features
like:
* content filtering, basing on multiple rules.
* encrypted forwarding, including hidding the traffic under protocols like
  HTTP, HTTPS or even XMPP.

A friendly webUI should be implemented.


## Combination of proxies

The system of proxy is designed to be combinable and chainable. We use
following model to describe this system.

                           +------------------------------------+
                      +--> | Traffic Monitoring and Controlling |
                      |    +------------------------------------+
                     \|/
    +----------+  +--------+-----------+            +-----------+--------+
    | Requests |  | Proxy  : Mechanism |  Internet  | Mechanism : Proxy  |
    |  from    |->|        :           | =========> |           :        | -> O
    | Browsers |  | Client : Client    |            | Server    : Server |
    +----------+  +--------+-----------+            +-----------+--------+

There are 2 types of objects here, a proxy and a mechanism. Each of them can
furthur be classified as two parts: a client and a server. And we use 4 such
objects to set up a tunnel.

### Proxy Client

A proxy client serves as the interface to the user's browser. Therefore it
can looks like either a SocksV5 or a HTTP proxy.

Another job of this object is control and monitor the traffic.

### Mechanism Client

A mechanism client serves as converting the stream, which is received from
the proxy client, into another form or even another protocol. In this way the
traffic emitted from this mechanism client is able to overcome the hostility
in internet.

### Mechanism Server

A mechanism server runs on the proxy computer and takes in the traffic, which
is sent by mechainsm client. Then the traffic is converted, or decrypted, and
forwarded to the proxy server.

### Proxy Server

The proxy server receives the proxied traffic and can optionally proxy it
immediately to the computer in reach, or can forward it using protocols like
SocksV5 to another proxy client, or another proxy program.
