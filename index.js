  // "cwd": "D:\\Ziax\\Desktop\\zglacier\\path",
var Config = require('./_config.json'),
    azure = require('./azure.js'),
    // azure = require('azure'),
    hash = require('./hash.js'),
    web = require('./web.js'),

    fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    Q = require('q'),
    util = require('util'),
    crypto = require('crypto'),
    ASync = require('async'),
    debug = require('debug')('index.js'),
    // lz4 = require('lz4'), // No benefits...
    counter = 0;

  function doGlob (callback) {
    glob(Config.path, { cwd: Config.cwd }, function (err, files) {
      if (err) throw err;
      callback(null, files);
    });
  }

  function doHash (data, callback) {
    ASync.mapSeries(data, function (item, cb) {
      hash.file(path.resolve(Config.cwd, item)).then(function(r) {
        cb(null, { file: item, hash: r });
      }, function (err) {
        cb(err, {})

      });
    }, function (err, res) { 
      if (err) throw err;
      callback(null, res);
    });
  }

  function doCheckFile (data, callback) {
    ASync.filterSeries(data, function (item, cb) {
      fs.lstat(path.resolve(Config.cwd, item), function (err, stats) {
        if (err) throw err;
        cb(!stats.isDirectory());
      });
    }, function (results) {
      callback(null, results);
    })

  }

  function doUpload(data, callback) {
    ASync.eachSeries(data, function (item, cb) {
      azure.upload(item).then(function () { cb(); });
    }, function (err, res) { if (err) throw err; callback(null, data); });
  }

  function doBackup(data, callback) {
    ASync.eachSeries(data, function (item, cb) {
      var msg = path.basename(item) + ' [' + (++counter) + '/' + data.length + ']:';
      util.print(msg);
      web.emit(msg);
      hash.file(path.resolve(Config.cwd, item)).then(function (hash) {
        azure.upload({ file: item, hash: hash }).then(function () { cb(); });
        // cb();
      });

    }, function (err, res) { if (err) throw err; callback(null, data); });
  }
  console.log(debug)

  debug('test %s', process.argv);

  var arg = process.argv[2];
  if (arg === 'list') {
    azure.list(function (res) {
      console.log(res);
    })
  } else if (arg === 'get') {
    azure.get(process.argv[3], function (err) {
      if (err) throw err;
    });
  } else if (arg === 'upload') {
    ASync.waterfall([doGlob, doCheckFile, doBackup], function (err, results) { console.log('Done'); process.exit(); })
  } else if (arg === 'diff') {
    azure.diff();
  } else if (arg === 'local') {
    var local = process.argv[3];
    fs.createReadStream(local)
      .pipe(crypto.createDecipheriv('aes-256-cbc', Config.key, Config.iv))
      .pipe(fs.createWriteStream('local'));
  } else if (arg === 'folder') {
    var folder = path.resolve(process.argv[3]);
    var files = fs.readdirSync(folder);

    console.log(files);

  } else if (arg === 'test') {
    // var local = process.argv[3];
    // fs.createReadStream(local)
    //   .pipe(lz4.createEncoderStream())
    //   .pipe(crypto.createCipheriv('aes-256-cbc', Config.key, Config.iv))
    //   .pipe(fs.createWriteStream('local'));
  }


  return;
  // var fd = fs.createReadStream('./crypt.png')
  //   .pipe(crypto.createDecipheriv('aes-256-cbc', Config.key, Config.iv))
  //   .pipe(fs.createWriteStream('./boo2.jpg'));
  // return;

  // var fd = fs.createReadStream('./org.jpg')
  //   .pipe(crypto.createCipheriv('aes-256-cbc', Config.key, Config.iv))
  //   .pipe(fs.createWriteStream('./crypt.jpg'));

  // var blobService = azure.createBlobService(Config.azure.blob, Config.azure.key);
  // blobService.getBlobProperties('pictures2', 'org.jpg', function(err, blob) {
  //   console.log(arguments);
  // });

  // var filename = 'foo'+crypto.randomBytes(4).readUInt32LE(0)+'bar';
  // fs.createReadStream('./org.jpg')
  //   .on('end', function () {
  //     console.log('end')
  //     blobService.createBlockBlobFromFile('pictures2', 'test.png', filename, function (err) {
  //       fs.unlink(filename);
  //     });
  //   })
  //   .pipe(crypto.createCipheriv('aes-256-cbc', Config.key, Config.iv))
  //   .pipe(fs.createWriteStream(filename))
  //   ;



  // blobService.logger = new azure.Logger(azure.Logger.LogLevels.DEBUG);
  // fs.createReadStream('./org.jpg').pipe(blobService.createBlob('pictures2', 'org.jpg', azure.Constants.BlobConstants.BlobTypes.BLOCK, { blockIdPrefix: 'block' }, function (err, b, c) {
  // }));

  // var fd = fs.createReadStream('./org.jpg')
  // var myWritableStreamBuffer = new streamBuffers.WritableStreamBuffer({ initialSize: (100 * 1024), incrementAmount: (10 * 1024) });
  // fd.pipe(crypto.createCipheriv('aes-256-cbc', Config.key, Config.iv)).pipe(myWritableStreamBuffer);
  // fd.on('close', function () {
  //   console.log('close', myWritableStreamBuffer.size());
  //   var read = new streamBuffers.ReadableStreamBuffer({ initialSize: (100 * 1024), incrementAmount: (10 * 1024) });
  //   read.put(myWritableStreamBuffer.getContents());
  //    blobService.createBlockBlobFromStream('pictures2', 'picture.jpg', read, myWritableStreamBuffer.size(), { contentTypeHeader:'image/jpg' }, function(err, a,b) {
  //      if (err) throw err;
  //      console.log(arguments);
  //    });
  // })

  // bs.createBlockBlobFromFile('c', 'test.png', path, function (error) { });

  // fs.createReadStream('./org.jpg').pipe(fs.createWriteStream('./testa.jpg'));

//   var fw = new streamBuffers.WritableStreamBuffer();
//     fs.createReadStream('./org.jpg')
//     .pipe(crypto.createCipheriv('aes-256-cbc', Config.key, Config.iv))
//     .pipe(fw);


// console.log(fw.getContents());
  // blobService.createBlockBlobFromStream('pictures2', 'picture.jpg', fd, 2000000, { contentTypeHeader:'image/jpg' }, function(err, a,b) {
  //   if (err) throw err;
  //   console.log(arguments);
  // });



// loadBase64Image('http://media.ch9.ms/ch9/31f0/7169e8db-e761-4c9f-afd0-0ad136a531f0/EdgeShow56WindowsAzurePowerShellDemos.mp4', function (image, prefix) {
//     var fileBuffer = new Buffer(image, 'base64');
//       //console.log(memStream.toString());
//     //console.log('pipe end');
//     blobService.createBlockBlobFromStream('node-demo-container', 'picture.jpg', new ReadableStreamBuffer(fileBuffer), fileBuffer.length, { contentTypeHeader:'image/jpg' },function(error)
//     {
//     //console.log('api result');
//       if(!error)
//       {
//     console.log('ok');
//       }
//       else
//       {
//       console.log(error);
//       }
      
//     });
// });
return;


// var Db = require('tingodb')().Db,
//     assert = require('assert');

// var db = new Db('./', {});
// // Fetch a collection to insert document into
// var collection = db.collection("batch_document_insert_collection_safe");
// // Insert a single document
// collection.insert([{hello:'world_safe1'}
//   , {hello:'world_safe2'}], {w:1}, function(err, result) {
//   assert.equal(null, err);

//   // Fetch the document
//   collection.findOne({hello:'world_safe2'}, function(err, item) {
//     assert.equal(null, err);
//     assert.equal('world_safe2', item.hello);
//   })
// });



return;
var AWS = require('aws-sdk'),
    crypto = require('crypto'),
    fs = require('fs');
var iv = new Buffer('asdfasdfasdfasdf')
var key = new Buffer('asdfasdfasdfasdfasdfasdfasdfasdf')

fs.createReadStream("./boo")
  .pipe(crypto.createDecipheriv('aes-256-cbc', key, iv))
  .pipe(fs.createWriteStream('./boo2'));


return
fs.createReadStream("./test_doc.txt")
  .pipe(crypto.createCipheriv('aes-256-cbc', key, iv))
  .pipe(fs.createWriteStream('./boo'));

return;
AWS.config.loadFromPath('./aws-config.json');

cipher.update(new Buffer("mystring"));
var enc = cipher.final('base64');
console.log(enc)



// var glacier = new AWS.Glacier();
// glacier.listVaults({}, function (err, data) {
//   if (err) throw err;
//   console.log(data);

// });



// var glacier = new AWS.Glacier(),
//     vaultName = 'YOUR_VAULT_NAME',
//     buffer = new Buffer(2.5 * 1024 * 1024), // 2.5MB buffer
//     partSize = 1024 * 1024, // 1MB chunks,
//     numPartsLeft = Math.ceil(buffer.length / partSize),
//     startTime = new Date(),
//     params = {vaultName: vaultName, partSize: partSize.toString()};

// // Compute the complete SHA-256 tree hash so we can pass it
// // to completeMultipartUpload request at the end
// var treeHash = glacier.computeChecksums(buffer).treeHash;

// // Initiate the multi-part upload
// console.log('Initiating upload to', vaultName);
// glacier.initiateMultipartUpload(params, function (mpErr, multipart) {
//   if (mpErr) { console.log('Error!', mpErr.stack); return; }
//   console.log("Got upload ID", multipart.uploadId);

//   // Grab each partSize chunk and upload it as a part
//   for (var i = 0; i < buffer.length; i += partSize) {
//     var end = Math.min(i + partSize, buffer.length),
//         partParams = {
//           vaultName: vaultName,
//           uploadId: multipart.uploadId,
//           range: 'bytes ' + i + '-' + (end-1) + '/*',
//           body: buffer.slice(i, end)
//         };

//     // Send a single part
//     console.log('Uploading part', i, '=', partParams.range);
//     glacier.uploadMultipartPart(partParams, function(multiErr, mData) {
//       if (multiErr) return;
//       console.log("Completed part", this.request.params.range);
//       if (--numPartsLeft > 0) return; // complete only when all parts uploaded

//       var doneParams = {
//         vaultName: vaultName,
//         uploadId: multipart.uploadId,
//         archiveSize: buffer.length.toString(),
//         checksum: treeHash // the computed tree hash
//       };

//       console.log("Completing upload...");
//       glacier.completeMultipartUpload(doneParams, function(err, data) {
//         if (err) {
//           console.log("An error occurred while uploading the archive");
//           console.log(err);
//         } else {
//           var delta = (new Date() - startTime) / 1000;
//           console.log('Completed upload in', delta, 'seconds');
//           console.log('Archive ID:', data.archiveId);
//           console.log('Checksum:  ', data.checksum);
//         }
//       });
//     });
//   }
// });
