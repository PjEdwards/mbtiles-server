var express = require("express"),
    app = express(),
    MBTiles = require('@mapbox/mbtiles'),
    p = require("path"),
    config = require('config');

// path to the mbtiles; default is the server.js directory
var tilesDir = p.join(__dirname, 'data');
var port = config.port || 8084;
var protocol = config.protocol;

// Set return header
function getContentType(t) {
  var header = {};

  // CORS
  // header["Access-Control-Allow-Origin"] = "*";
  // header["Access-Control-Allow-Headers"] = "Origin, X-Requested-With, Content-Type, Accept";

  // Cache
  header["Cache-Control"] = "no-cache, no-store, must-revalidate";

  // request specific headers
  if (t === "png") {
    header["Content-Type"] = "image/png";
  }
  if (t === "jpg") {
    header["Content-Type"] = "image/jpeg";
  }
  if (t === "pbf") {
    header["Content-Type"] = "application/x-protobuf";
    header["Content-Encoding"] = "gzip";
  }
  if (t === "json") {
    header["Content-Type"] = "application/json";
  }

  return header;
}

app.get('/:s/:d.json', function(req, res) {
  if(!protocol) {
    protocol = req.protocol;
  }

  new MBTiles(p.join(tilesDir, req.params.s + '.mbtiles'), function(err, mbtiles) {
    mbtiles.getInfo(function(err, info){
      if(err) {
        console.log("getInfo called on", p.join(tilesDir, req.params.s + '.mbtiles'), "resulted in error:", err);
      } else {
        info.tiles = [protocol + "://" + req.hostname + "/vector/" + req.params.s + "/{z}/{x}/{y}.pbf"]
        res.set(getContentType(req.params.t));
        res.send(info);
      }
    });
  });
});

// tile cannon
app.get('/:s/:z/:x/:y.:t', function(req, res) {
  new MBTiles(p.join(tilesDir, req.params.s + '.mbtiles'), function(err, mbtiles) {
    mbtiles.getTile(req.params.z, req.params.x, req.params.y, function(err, tile, headers) {
      if (err) {
        if( false ) { //err == 'Error: Tile does not exist') {
          res.set(getContentType(req.params.t));
          res.send('');
        } else {
          var header = {};
          // header["Access-Control-Allow-Origin"] = "*";
          // header["Access-Control-Allow-Headers"] = "Origin, X-Requested-With, Content-Type, Accept";
          header["Content-Type"] = "text/plain";
          res.set(header);
          res.status(404).send('Tile rendering error: ' + err + '\n');
        }
      } else {
        res.set(getContentType(req.params.t));
        res.send(tile);
      }
    });
    if (err) console.log("error opening database");
  });
});

// start up the server
console.log('Listening on port: ' + port);
app.listen(port);
