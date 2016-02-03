"use strict";

var fs = require('fs'),
    soap = require('..'),
    https = require('https'),
    constants = require('constants'),
    util = require('util'),
    req = require('request'),
    httpClient = require('../lib/http.js'),
    events = require('events'),
    stream = require('readable-stream'),
    duplexer = require('duplexer'),
    should = require('should'),
    semver = require('semver'),
    assert = require('assert');

// var test = {};
// test.service = {
//   StockQuoteService: {
//     StockQuotePort: {
//       GetLastTradePrice: function(args) {
//         if (args.tickerSymbol === 'trigger error') {
//           throw new Error('triggered server error');
//         } else {
//           return { price: 19.56 };
//         }
//       }
//     }
//   }
// };

// test.sslOptions = {
//   key: fs.readFileSync(__dirname + '/certs/agent2-key.pem'),
//   cert: fs.readFileSync(__dirname + '/certs/agent2-cert.pem')
// };

describe('SOAP Client(SSL)', function() {
  // before(function(done) {
  //   fs.readFile(__dirname + '/wsdl/strict/stockquote.wsdl', 'utf8', function(err, data) {
  //     assert.ok(!err);
  //     test.wsdl = data;
  //     done();
  //   });
  // });

  // beforeEach(function(done) {
  //   test.server = https.createServer(test.sslOptions, function(req, res) {
  //     res.statusCode = 404;
  //     res.end();
  //   }).listen(51515, function() {
  //     test.soapServer = soap.listen(test.server, '/stockquote', test.service, test.wsdl);
  //     test.baseUrl =
  //       'https://' + test.server.address().address + ':' + test.server.address().port;

  //     if (test.server.address().address === '0.0.0.0' || test.server.address().address === '::') {
  //       test.baseUrl =
  //         'https://127.0.0.1:' + test.server.address().port;
  //     }
  //     done();
  //   });
  // });

  // afterEach(function(done) {
  //   test.server.close(function() {
  //     test.server = null;
  //     delete test.soapServer;
  //     test.soapServer = null;
  //     done();
  //   });
  // });

  var test = {};
  test.sslOptions = {
    key: fs.readFileSync(__dirname + '/certs/agent2-key.pem'),
    ca: fs.readFileSync(__dirname + '/certs/agent2-cert.pem'),
    cert: fs.readFileSync(__dirname + '/certs/agent2-cert.pem')
  };

  util.inherits(CustomAgent, events.EventEmitter);

  CustomAgent.prototype.addRequest = function(req, options) {
      console.log('11--10th-------------------------------------------------------------');
    req.onSocket(this.proxyStream);
  };

//Make a custom http agent to use ..... instead of ......
  function CustomAgent(options, socket){
      console.log('12--3rd-------------------------------------------------------------');
    var self = this;
    events.EventEmitter.call(this);
    self.requests = [];
    self.maxSockets = 1;
    self.proxyStream = socket;
    self.method = 'POST';
    self.options = options || {};
    self.proxyOptions = {};
      console.log('13--4th-------------------------------------------------------------');
  }

  var options = {
    hostname: 'apitest.authorize.net',
    port: 443,
    path: '/soap/v1/',
    method: 'POST',
    ca: fs.readFileSync(__dirname + '/certs/agent2-cert.pem'),
    tunnel: true,
    headers: {'Content-Type': 'text/xml',
            //'Content-Length': Buffer.byteLength(post_data),
            // 'Content-Length': post_data.length,
            'Connection': 'keep-alive',
            "SOAPAction": ""}
    };

  //Create a duplex stream     
  var httpReqStream = new stream.PassThrough();
  var httpResStream = new stream.PassThrough();
  var socketStream = duplexer(httpReqStream, httpResStream);

  //Custom httpClient
  function MyHttpClient (options, socket){
    console.log('14--1st-------------------------------------------------------------');
    httpClient.call(this,options);
    console.log('15--2nd----------------------------------------------------options--', options);
    var tempAgent = new CustomAgent(options, socket);
    this.agent = tempAgent.agent;
    // this.agent = new CustomAgent(options, socket);
    console.log('16--5th----------------------------------------------------agent----', this.agent);
  }

/*****************/
// var args = '{<messages>
//           <MessagesTypeMessage>
//             <code>1</code>
//             <text>one</text>
//           </MessagesTypeMessage>
//           <MessagesTypeMessage>
//             <code>2</code>
//             <text>two</text>
//           </MessagesTypeMessage>
//         </messages>}'
/*****************/

  util.inherits(MyHttpClient, httpClient);

  MyHttpClient.prototype.request = function(rurl, data, callback, exheaders, exoptions) {
      console.log('17--6th--data-----------------------------------------------------------', data);
    var self = this;
    console.log('w-odd-options------------------------------------------------------------', options);
    var options = self.buildRequest(rurl, data, exheaders, exoptions);
    console.log('x-odd-options------------------------------------------------------------', options);

    //Specify agent to use
    options.agent = this.agent;
      console.log('18--7th-------------------------------------------------------------');
    var headers = options.headers;
      console.log('19--8th-------------------------------------------------------------');
    var req = self._request(options, function(err, res, body) {
      console.log('20---------------------------------------------------------------');
      if (err) {
      console.log('21---------------------------------------------------------------');
        return callback(err);
      }
      console.log('22---------------------------------------------------------------');
      body = self.handleResponse(req, res, body);
      callback(null, res, body);
    });
    if (headers.Connection !== 'keep-alive') {
      console.log('23--9th-------------------------------------------------------------');
      req.end(data);
    }
      console.log('24---------------------------------------------------------------');
    return req;
  };

  var wsdl = fs.readFileSync('./test/wsdl/Service.wsdl').toString('utf8');
  httpReqStream.once('readable', function readRequest() {
    console.log('.....1:');
    var chunk = httpReqStream.read();
    console.log('.....2 chunk:', chunk);
    should.exist(chunk);
    console.log('.....3:');
    
    //This is for compatibility with old node releases <= 0.10
    //Hackish
    if(semver.lt(process.version, '0.11.0'))
    {
      console.log('.....6:');
      socketStream.on('data', function(data) {
        socketStream.ondata(data,0,1984);
      });
    }
    //Now write the response with the wsdl
    console.log('.....4:');
    // var state = httpResStream.write('HTTP/1.1 200 OK\r\nContent-Type: text/xml; charset=utf-8\r\nContent-Length: 1904\r\n\r\n'+wsdl);
    var state = httpResStream.write('HTTP/1.1 200 OK\r\nContent-Type: text/xml; charset=utf-8\r\nContent-Length: 1904\r\n\r\n'+wsdl);
    console.log('.....5 state:', state);
  });


  it('should connect to an SSL server', function(done) {
    // soap.createClient(__dirname + '/wsdl/strict/stockquote.wsdl', function(err, client) {
      console.log('25--options-------------------------------------------------------------', options);
    var httpCustomClient = new MyHttpClient(options, socketStream);
      console.log('26---------------------------------------------httpCustomClient--', httpCustomClient);
    var url = 'https://apitest.authorize.net/soap/v1/Service.asmx?WSDL';
      console.log('27---------------------------------------------------------------');
    soap.createClient(url, {httpClient: httpCustomClient}, function(err, client) {
      console.log('28---------------------------------------------------------------');
      console.log('after created the client:', client);
      console.log('*1*************************************************');
      assert.ok(!err);
      console.log('*2*************************************************');
// "https://api.authorize.net/soap/v1/IsAlive"
      // client.setEndpoint(test.baseUrl + '/stockquote');
      client.setEndpoint("https://apitest.authorize.net/soap/v1/Service.asmx");
      console.log('*3*************************************************');
      client.setSecurity({
        addOptions:function(options){
          options.cert = test.sslOptions.cert,
          options.key = test.sslOptions.key,
          options.rejectUnauthorized = false;
          options.secureOptions = constants.SSL_OP_NO_TLSv1_2;
          options.strictSSL = false;
          options.tunnel = true;
          options.agent = new https.Agent(options);
        },
        toXML: function() { return ''; }
      });
      console.log('*4*************************************************\n', client);

      client.IsAlive('', function(err, result) {
        console.log('*5*************************************************');
        assert.ok(!err);
        // assert.equal(19.56, parseFloat(result.price));
        done();
      });
    });
  });

});
