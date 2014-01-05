(function () {
    var Db = require('tingodb')().Db,
    db = new Db('./', {}),
    col = db.collection("zbackup.db");

  function exists (item, callback) {
    col.findOne({_id: item.hash}, function (err, res) {
      if (err) throw err;
      callback(!!res);
    });
  }

  function store (item) {
    col.insert({ _id: item.hash, file: item.file, hash: item.hash });
  }

  module.exports = {
    store: store,
    exists: exists

  }
}());
