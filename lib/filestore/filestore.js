
var Seed;

try {
  Seed = require('seed');
} catch (err) {
  console.error('Cannot find module seed. Is it installed?');
  process.exit(1);
}

var Store = Seed.Store
  , _ = require('./utils')
  , fs = require('fs')
  , path = require('path')
  , uid = new Seed.ObjectId();

var FileStore = Store.extend({

    name: 'FileStore'

  , MIN_SEED_VERSION: '0.1.7'

  , initialize: function (options) {
      options = options || {};
      this.path = options.path;
      if (!this.path || !path.existsSync(this.path)) {
        this.err = new Seed.SeedError('Problem with path provided to FileStore', { path: this.path });
        this.emit('error', this.err);
      }
    }

    /**
     * # .get()
     *
     * Read: Get the value of an entry in the store
     * given an ID.
     *
     * @public {Object} seed prepared model from sync.
     * @api public
     */

  , get: function (seed) {
      var promise = new this.Promise();;
      if (this.err) {
        promise.reject(this.err);
        return promise.promise;
      }

      var id = seed.data.id
        , file = path.join(this.path, seed.collection, id + '.json');
      path.exists(file, function (exists) {
        if (!exists) {
          promise.resolve(undefined);
        } else {
          fs.readFile(file, 'utf8', function (err, raw) {
            if (err) {
              promise.reject(err);
              return;
            }
            var data = JSON.parse(raw);
            promise.resolve(data);
          });
        }
      });

      return promise.promise;
    }

    /**
     * # .set()
     *
     * Create or update: Set the whole value of an entry
     * in the store. Creates an ID if one does not exist.
     *
     * @public {Object} seed prepared model from sync.
     * @api public
     */

  , set: function (seed) {
      var promise = new this.Promise();;
      if (this.err) {
        promise.reject(this.err);
        return promise.promise;
      }

      var id = seed.data.id;
      if (!id) {
        id = uid.gen();
        seed.data.id = id;
      }

      var file = path.join(this.path, seed.collection, id + '.json')
        , data = JSON.stringify(seed.data);
      _.mkdir(path.dirname(file), function(err) {
        if (err) {
          promise.reject(err);
        } else {
          fs.writeFile(file, data, 'utf8', function (err) {
            if (err) {
              promise.reject(err);
            } else {
              promise.resolve(seed.data);
            }
          });
        }
      });

      return promise.promise;
    }

    /**
     * # .fetch()
     *
     * Read: Get the value of an entry in the store
     * given an ID.
     *
     * @public {Object} seed prepared model from sync.
     * @api public
     */

  , fetch: function (seed) {
      var promise = new this.Promise()
        , self = this;
      if (this.err) {
        promise.reject(this.err);
        return promise.promise;
      }

      var dir = path.join(this.path, seed.collection)
        , data = []
        , count = 0;
      path.exists(dir, function (exists) {
        if (!exists) {
          promise.resolve([]);
        } else {
          fs.readdir(dir, function (err, files) {
            if (err) {
              promise.reject(err);
            } else {

              // this is executed after each read
              function after () {
                count++;
                if (count == files.length) {
                  if (!seed.query) {
                    promise.resolve(data);
                  } else {
                    var q = new Seed.Query(seed.query)
                      , res = q.test(data);
                    promise.resolve(res);
                  }
                }
              }

              // loop through the files
              files.forEach(function(file) {
                var _json = path.join(self.path, seed.collection, file);
                fs.stat(_json, function (err, stat) {
                  if (err) {
                    promise.reject(err);
                  } else {
                    if (stat && !stat.isDirectory()) {
                      var raw = fs.readFileSync(_json, 'utf8');
                      data.push(JSON.parse(raw));
                    }
                    after();
                  }
                });
              });
            }
          });
        }
      });
    }
});

module.exports = FileStore;