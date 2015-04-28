var api = require('bodhi-js-client');
var async = require('async');
var extend = require('deep-extend');

var client = new api.Client({
    uri: 'https://api.bodhi-dev.io',
    namespace: 'walker',
    credentials: new api.BasicCredential('admin__walker', 'admin__walker')
})

//client.get('resources/Store', function(err, json, ctx){
//    console.log(json);
//});
//
//async.parallel({
//    me: async.apply(client.get, '/me'),
//    stores: async.apply(client.get, 'resources/Store')
//}, function(err, result){
//    console.log(result);
//});

function remove(json, ctx, callback){
    console.log('remove ...', ctx.request.uri);
    try {
        client.delete(ctx.request.uri, callback);
    } catch (err){
        callback(err);
    }
}

function put(ext, json, ctx, callback){
    console.log('putting ...', ctx.request.uri);
    try {
        json = extend(json, ext);
        client.put(ctx.request.uri, json, callback);
    } catch (err){
        callback(err);
    }
}

function fetch(json, ctx, callback){
    console.log('fetching ... ', ctx.request.uri);
    client.get(ctx.request.uri, callback);
}

//find and delete
//async.waterfall([
//    async.apply(client.get, 'resources/Store/0a051f50-84b6-4c9b-93b5-86969d6d4e33'),
//    async.apply(remove),
//    //async.apply(fetch),
//], function(err, result){
//    console.log('**********');
//    console.log(arguments);
//});


//find and update - find and patch works the same
//async.waterfall([
//    async.apply(client.get, 'resources/Store/0a051f50-84b6-4c9b-93b5-86969d6d4e33'),
//    async.apply(put, newRepresentation, oldRepresentation, ctx),
//    async.apply(fetch),
//], function(err, result){
//    console.log('**********');
//    console.log(arguments);
//});

//rapidLoad

var stores = [];

for(i = 0; i < 3; i++){
    stores.push({
        name: 'n-' + i,
        display_name: 'nn ' + i,
        store_number: "" + (991 + i)
    })
}

//console.log(stores);

//batch inserts
async.map(stores, function(store, callback){
    callback( null, function _create(cb){
        client.post('resources/Store', store, function(err, json, ctx){
            cb(err, ctx);
        });
    })
}, function(err, inserts){
    console.log(inserts);
    async.parallelLimit(inserts, 2, function(err, result){
        if(err){
            console.log(err);

        } else {
            console.log(result.length);
            for (var k = 0; k < result.length; k++) {
                var parts = result[k].headers.location.split('/');
                console.log(parts);
                //console.log(parts[parts.length - 1]);
                stores[k].sys_id = parts[parts.length - 1];
                console.log(stores[k]);
            }
        }
    });
});
