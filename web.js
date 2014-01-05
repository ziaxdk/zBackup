(function () {
  var app = require('http').createServer(handler)
    , io = require('socket.io').listen(app, 
      {
        'log level': '0',
        'browser client minification': true,
        'browser client etag': true
      });


  function handler (req, res) {
    res.writeHead(200);
    res.end('<!doctype html>' +
'<html>' +
'<head>' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'</head>' +
'  <body>' +
'    <div id="news">Hold on...</div>' +
'    <script src="/socket.io/socket.io.js"></script>' +
'    <script>' +
'      var socket = io.connect(\'http://\'+window.location.hostname),' +
'          theDiv = document.getElementById(\'news\');' +
'      socket.on(\'news\', function (data) {' +
// '        console.log(data);' +
// '        var e = document.createElement(\'div\');' +
// '        e.appendChild(document.createTextNode(data));' +
// '        theDiv.appendChild(e);' +
'           theDiv.innerHTML = data;' +
'      });' +
'    </script>' +
'  </body>' +
'</html>');
  };

  function quit () {
    app.close(function () {
      console.log('web.js stopped');
    });
  }

  function emit (msg) {
    io.sockets.emit('news', msg);
  }


  app.listen(8080, function () {
    console.log('web.js running');
  });


  module.exports = {
    quit: quit,
    emit: emit

  }

}());