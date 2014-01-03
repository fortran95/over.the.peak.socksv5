/*
 * a chainable router, aka handler(a function) finder.
 *
 * /a       will be handled at the 1st handler, and return the function
 *          registered under name 'a'.
 * /a/      will be handled at the 2nd handler, and return the function
 *          registered under name ''.
 * /a/b     will be handled at the 2nd handler, and return the function
 *          registered under then name 'b'.
 *
 * usage:
 *  var rootRouter = new Router(),
 *      bRouter = new Router();
 *  rootRouter.handle('', function(){console.log('Homepage.')});
 *  rootRouter.sub('b', bRouter);
 *  bRouter.handle('b', [FUNCTION]);
 *
 *  rootRouter('/a/b'); // returns a function, or false, if not found.
 */

function router($){
    var self = this;

    var handlers = {}, subRouters = {};

    function find(url){
        var parsed = $.nodejs.url.parse(url),
            urlPathname = parsed.pathname;
        var parser = /^\/([^\/]*)(.*)$/;

        var exec = parser.exec(urlPathname);

        // no handler found
        if(null == exec) return false;

        var current = exec[1], next = exec[2];
        if(next){
            // take 'current' as the name of a subRouter.
            if(undefined == subRouters[current]) return false;
            return find.proxy(subRouters[current](next));
        } else {
            // take 'current' as the name of a handler.
            if(undefined == handlers[current]) return false;
            return find.proxy(handlers[current]);
        };
    };

    find.handle = function(name, func, options){
        if(undefined != options)
            func.__options = options;
        handlers[name] = func;
        return find;
    };

    find.sub = function(name, subRouter){
        subRouters[name] = subRouter;
        return find;
    };


    /*
     * the Router is a function searcher, which searches in a chained tree
     * the required function.
     *
     * by setting this proxy function, the searched function can be altered.
     * this is useful if we want a generic template applies.
     *
     * the returned new function and the searched function should have same
     * signature, aka the same variables by input.
     */
    find.proxy = function(gotFunc){
        return gotFunc;
    };

    return find;
};

module.exports = function(baum){
    return function(){
        return new router(baum);
    };
};
