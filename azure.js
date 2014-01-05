(function () {
  var Config = require('./_config.json'),
      web = require('./web.js'),
      db = require('./db.js'),
      crypto = require('crypto'),
      fs = require('fs'),
      util = require('util'),
      path = require('path'),
      azure = require('azure'),
      Q = require('q');

  
  var blobService = azure.createBlobService(Config.azure.blob, Config.azure.key);

  function uploadAzure(item, done) {
    var _azureFilename = path.resolve(Config.cwd, item.file);
    var _tempFilename = '_foo' + crypto.randomBytes(4).readUInt32LE(0) + 'bar';
    fs.createReadStream(_azureFilename)
    .on('end', function () {
      blobService.createBlockBlobFromFile(Config.azure.container, _azureFilename, _tempFilename, { }, function (err) {
        if (err) {
          util.print('\n*** ERROR uploading', item.file, err, '\n');
        } else {
          util.print(' - Done\n');
          db.store(item);
        }
        fs.unlinkSync(_tempFilename);
        done();
      });
    })
    .pipe(crypto.createCipheriv('aes-256-cbc', Config.key, Config.iv))
    .pipe(fs.createWriteStream(_tempFilename))
    ;

  }

  // function uploadAzure (item) {
  //   var fd = fs.createReadStream(path.resolve(Config.cwd, item.file))
  //     .pipe(crypto.createCipheriv('aes-256-cbc', Config.key, Config.iv))
  //     // .pipe(blobService.createBlob(Config.azure.container, path.resolve(Config.cwd, item.file), azure.Constants.BlobConstants.BlobTypes.BLOCK, function () { defer.resolve(); }));
  //     .pipe(blobService.createBlob(Config.azure.container, path.resolve(Config.cwd, item.file), azure.Constants.BlobConstants.BlobTypes.BLOCK,{}, function () { defer.resolve(); }));
  // }


  function upload (item) {
    // console.log('upload', item);
    // util.print("processing ", item.file);
    util.print(' - uploading');
    var defer = Q.defer();

    db.exists(item, function (res) {
      if (res) {
        util.print(" - Skip\n");
        defer.resolve();
        return;
      }
      // console.log('processing', item.hash);
      uploadAzure(item, function () { defer.resolve(); });
    });
     // setTimeout(function () { defer.resolve(); }, 50);

    return defer.promise;
  };

  function list (callback) {
    blobService.getContainerProperties(Config.azure.container, {}, function (err, container, response) {
      console.log(arguments)
      callback();
    });
  }

  function get (name, callback) {
    if (!name) {
      callback('no name provided ');
      return;
    }
    var _tempFilename = '_foo' + crypto.randomBytes(4).readUInt32LE(0) + 'bar';
    blobService.getBlobToFile(Config.azure.container, name, _tempFilename, {}, function (error, blockBlob, response) {
      if (error) callback(error);
      var fd = fs.createReadStream(_tempFilename)
        .on('end', function () {
          fs.unlink(_tempFilename, function (err) {
            callback(null);
          });
        })
        .on('error', function (err) {
          callback(err);
        })
        .pipe(crypto.createDecipheriv('aes-256-cbc', Config.key, Config.iv))
        .pipe(fs.createWriteStream(path.basename(name)));

    });

  }

  function diff () {
    blobService.listBlobs(Config.azure.container, { }, function (error, blobs, response) {
      if (error) console.log(error);
      console.log(blobs)
    });
  }

  module.exports = {
    upload: upload,
    list: list,
    get: get,
    diff: diff
  }
}());

// var fs = require('fs'),
//     crypto = require('crypto'),
//     azure = require('azure'),
//     iv = new Buffer('asdfasdfasdfasdf'),
//     key = new Buffer('asdfasdfasdfasdfasdfasdfasdfasdf'),
//     hash = crypto.createHash('sha1');

// hash.setEncoding('hex');
// var fd = fs.createReadStream("./test_doc.txt");
// fd.on('end', function() {
//     hash.end();
//     console.log(hash.read()); // the desired sha1sum
// });
// fd.pipe(crypto.createCipheriv('aes-256-cbc', key, iv))
// fd.pipe(blobService.createBlob('pictures', 'task2', azure.Constants.BlobConstants.BlobTypes.BLOCK));
