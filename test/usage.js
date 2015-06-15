//var client = require('./').createAgentClient('12121', 'my-ns');
//var client = require('./').createAgentClient('my-token', 'my-ns');

//var client = require('./../index').createUserClient('admin__chops', 'admin__chops', 'chops');

var api = require('./../index');


var client = new api.Client({
    uri         : 'https://api.bodhi-dev.io',
    namespace   : 'walker',
    credentials : new api.BearerToken('3211697496e5992395c6db10711e2532618f2715-1429039065723-admin__walker')
});

client.get('/me', function(err, json, response){
    console.log(err, json);
});

