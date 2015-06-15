//var client = require('./').createAgentClient('12121', 'my-ns');
//var client = require('./').createAgentClient('my-token', 'my-ns');

//var client = require('./../index').createUserClient('admin__chops', 'admin__chops', 'chops');

var api = require('./../index');


var client = new api.Client({
    uri         : 'https://api.bodhi-dev.io',
    namespace   : 'walker',
    credentials : new api.BearerToken('3211697496e5992395c6db10711e2532618f2715-1429039065723-admin__walker')
});

//client.get('/me',
//    function(err, json, ctx){
//        if(err){
//            console.log('err', err);
//        } else {
//            console.log(ctx.statusCode);
//            console.log(json);
//        }
//    });

//var representation = {
//    publisher: 'HotSchsasedules',
//    description: 'A job that collect yelp reviews',
//    name: 'brink-test'
//};

//copy path:
//move
//test

//var patch = new api.Patch();
//patch.replace('/publisher', 'sds!!');
//patch.remove('/publisher');
//console.log(patch.toJson());

function ResourceFilter(type){
    var util  = require('util');
    var filter = this;
    var res = ['resources', type].join('/');
    filter.toUri = function(criteria){
        return util.format('%s?where=%s', res, JSON.stringify(criteria));
    }
}

var res = 'resources/JobRegistry?where={"name":"patrick"}';

var url  = require('url');

console.log(url.parse(res));

var f = new ResourceFilter('JobRegistry').toUri({name: 'patrick'});
console.log(f);

//var uri = ['resources', 'JobRegistry', 'd782039d-536f-41df-93c5-201e8ec44415'];

console.log(res);

//client.fetch(res, //patch.toJson(),
//    function(err, json, ctx){
//        if(err){
//            console.log('err', JSON.stringify(err));
//        } else {
//            console.log(ctx.statusCode);
//            console.log(JSON.stringify(json, null, ' '));
//        }
//    });

//client.getAll(['/me', 'resources/Store'], function(err, sets){
//    console.log(err, sets);
//});

//var p = {
//    store_number: '111',
//    display_name: 'worked'
//}

var patch = new api.Patch();
patch.replace('/display_name', 'sds!!');
var p = patch.toJson();
console.log(p);

client.fetchAndPatch(new ResourceFilter('Store').toUri({name: 'this-is-n-aname-6'}), p, function(err, ctx){
    console.log(err, ctx);
});


//var stores = [];
//
//for(i = 0; i < 3; i++){
//    stores.push({
//        name: 'a-' + i,
//        display_name: 'aa ' + i,
//        store_number: "" + (121 + i)
//    })
//}
//
//console.log(stores);

//client.load('resource/Store', stores, function(err, ctx){
//    console.log('DONE');
//    console.log(err, ctx);
//});


//var basic  = new Basic('a','password');
//var bearer = new Bearer('1213121--12==12');


//console.log(typeof client);
//console.log(typeof basic);
//console.log(typeof bearer);
//
//console.log(client instanceof Client);
//console.log(basic  instanceof Basic);
//console.log(bearer instanceof Bearer);

//console.log(basic.toHeaders());
//console.log(bearer.toHeaders());

//var client = new Client({
//    uri         : 'https://host:port',
//    namespace   : '',
//    credentials : new User(username, password)
//});



