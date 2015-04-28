var http = require('http');
var concurrentServerRequests = 0;
var totalServerRequests = 0;
var PORT_BASE = 1337;

function createServer(host, port) {

    http.createServer(function (req, res) {
        ++concurrentServerRequests;
        ++totalServerRequests;

        console.log('Concurrent active server requests:' +
            concurrentServerRequests + ', total received:'  +
            totalServerRequests);

        console.log('%s %s', req.method, req.url);
        console.log(req.headers);

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify([{id: 12}]));
        res.end();

    }).listen(port, host);
    console.log('Server running at http://' + host + ':' + port);
}

createServer('127.0.0.1', PORT_BASE);