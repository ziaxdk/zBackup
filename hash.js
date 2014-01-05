(function () {
var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    crypto = require('crypto'),
    Q = require('q');

  function hashData (data) {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  function hashFile (file) {
    var defer = Q.defer();
    var md5sum = crypto.createHash('md5');

    var s = fs.ReadStream(file);
    s.on('error', function (err) {
      console.log(err);
      // if (err.errno === 28) // EISDIR
      // {
      //   defer.reject();
      //   return;
      // }
      throw err;
    })
    s.on('data', function(d) {
      md5sum.update(d);
    });

    s.on('end', function() {
      var hash = md5sum.digest('hex');
      util.print(' - ', hash);
      defer.resolve(hash);
    });
    return defer.promise;
  }

  module.exports = {
    text: hashData,
    file: hashFile
  }
}());


// var blobService = azure.createBlobService('picsziax', 'PIEHUe/+wMP3EKnJ+Uv4I30vR7WNtPi5MwlD7IQYU2jlRDN6ESY1r3kaCAHFu3amG4+oGOU+XmPhkmLvnjta0Q==');
// // blobService.createContainerIfNotExists('pictures', function(error) {
// //   if (error) throw error;
// // });
// var fd = fs.createReadStream("./test_doc.txt");
// fd.on('end', function() {
//     hash.end();
//     console.log(hash.read()); // the desired sha1sum
// });
// fd.pipe(crypto.createCipheriv('aes-256-cbc', key, iv))
// fd.pipe(blobService.createBlob('pictures', 'task2', azure.Constants.BlobConstants.BlobTypes.BLOCK));
