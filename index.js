(function(exports){

    var url       = require('url');
    var extend    = require('deep-extend');
    var async     = require('async');
    var request   = require('request');

    var DEFAULTS  = {
        timeout: 5000,
        pool: {
            maxSockets: 10
        },
        maxConcurrent: 20,
        json: true
    };

    var DEFAULT_SERVICE = "https://api.bodhi.space";

    function toPath(arg){
        return (typeof arg === Array || arg instanceof Array) ? arg.join('/') : arg;
    }

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    function noop(err){}

    function removeFlow(json, ctx, callback){

        if(json && json.sys_id)

            try {
                client.delete(json.sys_id, callback);
            } catch (err){
                callback(err);
            }
    }

    function putFlow(ext, json, ctx, callback){
        try {
            json = extend(json, ext);
            client.put(ctx.request.uri, json, callback);
        } catch (err){
            callback(err);
        }
    }

    function fetchFlow(json, ctx, callback){
        client.get(ctx.request.uri, callback);
    }


    function safeCallback(cb){
        return (cb && typeof cb === 'function') ? cb : noop;
    }

    function errorCallback(cb, req){

        //force a callback to exist
        cb = safeCallback(cb);
        req = req || req;


        return function(err, response, json) {
            if (err) {
                cb(err)
            } else if (response.statusCode >= 400) {
                if (!json){
                    err = new Error('api protocol error');
                    err.code   = 'invalid.json';
                    err.issues = 'no server response available';
                } else if (json.length > 1){
                    err = new Error('api protocol error');
                    err.issues = json;
                } else if(json.length === 1) {
                    json = json[0];
                    err = new Error(json.message);
                    err.code   = json.code;
                    err.status = json.parameters;
                } else {
                    err = new Error('api protocol error');
                }
                err.source = req || {};
                err.status = response.statusCode;
                err.api = true;
                return cb(err);
            } else {
                var ctx = {
                    statusCode: response.statusCode,
                    headers   : response.headers,
                    request   : req
                };
                switch (response.statusCode) {
                    case 200:
                        cb(null, json, ctx);
                        break;
                    case 201:
                    case 202:
                        cb(null, response.headers.location || null, ctx)
                        break;
                    case 204:
                        cb(null, null, ctx);
                        break;
                    default:
                        cb(null, null, ctx);
                        break;
                }
            }
        }
    }

    var Client = exports.Client = function(options){

        var client  = this;
        var _jar    = request.jar();

        options = options || {};

        //if uri => url
        if(options.uri){
            options.url = options.uri;
            delete options.uri;
        }

        //if !url => default
        if(!options.url){
            options.url = DEFAULT_SERVICE;
        }

        //if ns => safe namespace
        if(options.namespace && options.namespace.indexOf('/') > 0){
            options.namespace = (options.namespace.substring(0, options.namespace.indexOf('/')));
        }

        //if url and ns => url/ns/
        if(options.namespace && options.url){
            options.url = url.resolve(options.url, options.namespace + '/');
            delete options.namespace;
        }

        //allow either basic or bearer
        if(options.credentials){
            if((options.credentials instanceof BasicCredential || options.credentials instanceof BearerToken)){
                options = extend({}, options, options.credentials.toHeaders());
                delete options.credentials;
            }
        }

        var ctx             = extend({}, DEFAULTS, options);
        var _request        = request.defaults(ctx);
        var requestStyle    = (options.enqueue) ? 'async' : 'request';

        //internal request queue
        var requestQueue = async.queue(function work(requestCtx, responseHandler) {
            _request(requestCtx, responseHandler);
        }, options.maxConcurrent || 20);

        //resolve the endpoint
        client.resolve = function path(path){
            return url.resolve(options.url, toPath(path || ''));
        };

        //post(resource)           ==> sendNoData
        //post(resource, json)     ==> sendAndIgnore
        //post(resource, cb)       ==> invokeAnOperation without a payload
        //post(resource, json, cb) ==> sendAndWait
        client.post = function post(resource, json, cb){
            var options = {method: 'POST', json:true, body: json, jar: _jar};
            if(arguments.length === 2) {
                if(typeof arguments[1] === 'function'){
                    delete options.json;
                    delete options.body;
                    cb   = arguments[1];
                } else {
                    cb   = noop;
                }
            }
            client[requestStyle](resource, options , cb);
        };

        //demand JSON
        client.put = function put(resource, json, cb){
            cb = safeCallback(cb);
            if(!json){
                return cb && cb(new Error('No representation specified'));
            }
            client[requestStyle](resource, {method: 'PUT', json:true, body: json, jar: _jar} , cb);
        };

        //demand JSON
        client.patch = function patch(resource , json, cb){
            cb = safeCallback(cb);
            if(!json){
                return cb && cb(new Error('No patch document specified'));
            }
            client[requestStyle](resource, {method: 'PATCH', json:true, body: json, jar: _jar} , cb);
        };

        client.get = function get(resource , cb){
            client[requestStyle](resource, {method: 'GET'}, cb);
        };

        client.fetch = function fetch(resource , cb){
            cb = safeCallback(cb);
            client[requestStyle](resource, {method: 'GET', jar: _jar}, function(err, json, ctx){
                if(!err && ctx.statusCode === 200){
                    if(Array.isArray(json)){
                        if(json.length === 1){
                            json = json[0];
                        } else if(json.length === 0) {
                            json = {};
                        } else {
                            err = new Error('More than one resource found');
                        }
                    }
                }
                cb && cb(err, json, ctx);
            });
        };

        client.delete = function del(resource , cb){
            client[requestStyle](resource, {method: 'DELETE', jar: _jar} , cb);
        };


        function asResource(uri, obj){
            var parts = url.parse(uri);
            var path = parts.pathname.split('/');
            return [path[0], path[1], obj.sys_id].join('/');
        }


        function fetchAnd(resource, action, cb){
            async.waterfall([
                async.apply(client.fetch, resource),
                async.apply(action, resource)
            ], function(err, result){
                cb(err, result)
            });
        }

        client.fetchAndUpdate = function del(resource, partial, done){
            fetchAnd(resource, function(resource, object, ctx, callback){
                if(object && object.sys_id){
                    object = extend(object, partial);
                    var res = asResource(resource, object);
                    client.put(res, object, function(err, json, ctx){
                        callback(err, ctx);
                    })
                } else {
                    callback(new Error('No item to update'), null, null);
                }
            },done);
        };

        client.fetchAndPatch = function del(resource, patch, done){
            fetchAnd(resource, function(resource, object, ctx, callback){
                if(object && object.sys_id){
                    var res = asResource(resource, object);
                    client.patch(res, patch, function(err, json, ctx){
                        callback(err, ctx);
                    })
                } else {
                    callback(new Error('No item to patch'), null, null);
                }
            },done);
        };

        client.fetchAndRemove = function del(resource , done){
            fetchAnd(resource, function _remove(resource, object, ctx, callback){
                var res = asResource(resource, object);
                if(object && object.sys_id){
                    client.delete(res, function(err, json, ctx){
                        callback(err, ctx);
                    })
                } else {
                    callback(new Error('No item to remove'), null, null);
                }
            },done);
        };

        client.gather = function gather(queries, gathered){
            async.map(queries, function(query, callback){
                callback(null, function _get(cb){
                    client.get(query, function(err, json, ctx){
                        if(err){
                            cb(err);
                        } else {
                            cb(err, json);
                        }
                    });
                })
            }, function(err, posts){
                if(err){
                    gathered(err);
                } else {
                    async.series(posts, function (err, collection) {
                        gathered(err, collection);
                    });
                }
            });
        };

        client.async = function async(resource, overrides, cb){
            var req = extend(overrides, {
                uri : client.resolve(resource || '')
            });
            requestQueue.push(req,
                errorCallback(cb, {uri: req.uri, method: req.method, entity: req.body }));
        };

        client.request = function request(resource, overrides, cb){
            var req = extend(overrides, {
                uri : client.resolve(resource || '')
            });

            _request(req,  errorCallback(cb, {uri: req.uri, method: req.method, entity: req.body }));
        };
    };


    var BasicCredential = exports.BasicCredential = function(username, password){
        var credential = this;
        credential.toHeaders = function toHeader(){
            return {
                auth: {
                    user: username,
                    pass: password,
                    sendImmediately: true
                },
                headers:{
                    'User-Agent': 'nodejs/' + process.version
                }
            };
        }
    };


    var Patch = exports.Patch = function Patch(basis){
        this.changes = [];
        this.basis   = basis || null;
    };

    function ensure(path){
        return path = (path.charAt(0) === '/') ? path : '/' + path;
    }

    Patch.prototype = {

        //add a new property entirely
        add : function(path, value){
            //path = ensure(path);
            this.changes.push({op: 'add', path: path, value: value});
            return this;
        },

        //replace an existing property
        replace: function(path, value){
            //path = ensure(path);
            this.changes.push({op: 'replace', path: path, value: value});
            return this;
        },

        //remove an existing property
        remove : function(path){
            //path = ensure(path);
            this.changes.push({op: 'remove', path: path});
            return this;
        },

        copy: function(path, from){
            path = ensure(path);
            from = ensure(from);
            this.changes.push({op: 'copy', path: path, from: from});
            return this;
        },

        move: function(path, from){
            path = ensure(path);
            from = ensure(from);
            this.changes.push({op: 'move', path: path, from: from});
            return this;
        },


        toJson : function(){
            return this.changes;
        }

    };

    var ResourceFilter = exports.ResourceFilter = function ResourceFilter(type){
        var util  = require('util');
        var filter = this;
        var res = ['resources', type].join('/');
        filter.toUri = function(criteria){
            return util.format('%s?where=%s', res, JSON.stringify(criteria));
        }
    };


    var BearerToken = exports.BearerToken = function(token){
        var credential = this;
        credential.toHeaders = function toHeader(){
            return {
                auth: {
                    bearer: token,
                    sendImmediately: true
                },
                headers:{
                    'User-Agent': 'bodhi-agent/v1'
                }
            }
        }
    };

    exports.createUserClient  = function(user, password, namespace){
        if(!user || !password){
            throw new Error('Unspecified credentials: Missing either username of password');
        } else {
            var ctx = {
                credentials: new BasicCredential(user, password)
            };
            if(namespace) ctx.namespace = namespace;
            return new Client(ctx)
        }
    };

    exports.createAgentClient = function(token, namespace){
        if(!token){
            throw new Error('Unspecified credentials: Missing bearer token');
        } else {
            var ctx = {
                credentials: new BearerToken(token)
            };
            if(namespace) ctx.namespace = namespace;
            return new Client(ctx)
        }
    }

})(module.exports);