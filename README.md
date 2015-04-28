Basic API
---------

This library lives in artifactory now and will become public soon

````
npm install bodhi-space-client
````

Basic API
---------

````
var Client   = require('bodhi-rest').Client;
var Basic    = require('bodhi-rest').BasicCredential;
var Bearer   = require('bodhi-rest').BearerToken;
var agent    = require('bodhi-rest').createAgentClient('token', 'my-ns');
var user     = require('bodhi-rest').createUserClient('username', 'password', 'my-ns');
````

###Simple Setup

Let the package do the standard setup and supply the credentials plus the namespace

````
var agent    = require('bodhi-rest').createAgentClient('token', 'my-ns');
var user     = require('bodhi-rest').createUserClient('username', 'password', 'my-ns');
````

###Custom Setup

Take control of the entire setup process.

````
var Client   = require('bodhi-rest').Client;
var Basic    = require('bodhi-rest').BasicCredential;

var client = new Client({
    uri          : 'https://local:1337'
    namespace    : "miles",
    timeout      : 4000,
    maxConcurrent: 11,
    proxy        : 'https://localhost:9999',
    credentials  : new Basic('me', 'secret')
});
````

Client Usage
-------

###Relative URLs

A relative URL can be specified as a string or an array of path elements that will be concatenated into a string.

````
client.[<http-operation>]('relative/url', function(err, data, ctx){})
client.[<http-operation>](['resources', 'Store', id], function(err, data, ctx){})
`````

###Absolute URLs

An absolute URL starts with a '/' character and therefore ignores the established namespace. It can be used for public API calls , /me, anything that wants to bypass the namespace.

````
client.[<http-operation>]('/absolute/url', function(err, data, ctx){})
````

Sending Data

client.put('/absolute/url'  , {/* your updated resource here */}, function(err, data, ctx){})
client.patch('/absolute/url', {/* your patch document here */}, function(err, response, ctx){})
client.post('/absolute/url' , {/* your data here */}, function(err, data, ctx){})


Responses
---------

function(err, data, ctx)

###Errors

####System Errors

Same as before ... bad things happen at the infrastructure/runtime layer

####Protocol Errors

Anything with a 4XX or 5XX error code

* err.api     true
* err.status  http status code
* err.source  method, resource, and representation of the request
* err.message the message from the API server error
* err.code    code from the api server
* err.context parameters returned by the api server

###Data Element

* for a 200 data = the returned JSON
* for a 201 or 202 data = content of the location header
* for a 204 data = null

the ctx is

1. ctx.statusCode,
2. ctx.headers,
3. ctx.request = the method, resource, and representation of the original request