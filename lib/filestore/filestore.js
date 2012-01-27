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

// node v0.7.x compatibility
var _exists = fs.exists || path.exists
  , _existsSync = fs.existsSync || path.existsSync;

var FileStore = Store.extend({

    name: 'FileStore'

  , MIN_SEED_VERSION: '0.1.8'

  , initialize: function (options) {
      options = options || {};
      this.path = options.path;
      this.useSync = options.sync || false;
      if (!this.path || !_existsSync(this.path)) {
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
      var promise = new Seed.Promise();
      if (this.err) {
        promise.reject(this.err);
        return promise.promise;
      }

      var id = seed.data.id
        , file = path.join(this.path, seed.collection, id + '.json');
      _exists(file, function (exists) {
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

  , getSync: function (seed) {
    var promise = new Seed.Promise();
    if (this.err) {
      promise.reject(this.err);
      return promise.promise;
    }

    var id = seed.data.id
      , file = path.join(this.path, seed.collection, id + '.json')
      , exists = _existsSync(file);
    if (exists) {
      var raw = fs.readFileSync(file, 'utf8')
        , data = JSON.parse(raw);
      promise.resolve(data);
    } else {
      promise.resolve(undefined);
    }
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
      var promise = new Seed.Promise();
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

  , setSync: function (seed) {
    var promise = new Seed.Promise();
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
    _.mkdirSync(path.dirname(file));
    fs.writeFileSync(file, data, 'utf8');
    promise.resolve(seed.data);
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
      var promise = new Seed.Promise()
        , self = this;
      if (this.err) {
        promise.reject(this.err);
        return promise.promise;
      }

      var dir = path.join(this.path, seed.collection)
        , data = []
        , count = 0;
      _exists(dir, function (exists) {
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

      return promise.promise;
    }

  , fetchSync: function (seed) {
    var promise = new Seed.Promise()
      , self = this;
    if (this.err) {
      promise.reject(this.err);
      return promise.promise;
    }

    var dir = path.join(this.path, seed.collection)
      , data = []
      , count = 0;
    if (!_existsSync(dir)) {
      promise.resolve([]);
      return promise.promise;
    } else {
      var files = fs.readdirSync(dir);
      files.forEach(function (file) {
        var _json = path.join(self.path, seed.collection, file)
          , stat = fs.statSync(_json);
        if (!stat.isDirectory()) {
          var raw = fs.readFileSync(_json, 'uff8');
          data.push(JSON.parse(raw));
        }
      });
      if (!seed.query) {
        promise.resolve(data);
      } else {
        var q = new Seed.Query(seed.query)
          , res = q.test(data);
        promise.resolve(res);
      }
    }
    return promise.promise;
  }

  , destroy: function (seed) {
      var promise = new Seed.Promise()
        , self = this;
      if (this.err) {
        promise.reject(this.err);
        return promise.promise;
      }

      var id = seed.data.id
        , file = path.join(this.path, seed.collection, id + '.json');
      _exists(file, function (exists) {
        if (exists) {
          fs.unlink(file, function (err) {
            if (err) promise.reject(err);
            else {
              fs.readdir(path.dirname(file), function (err, files) {
                if (files.length == 0) {
                  fs.rmdir(path.dirname(file), function (err) {
                    if (err) self.emit('error', err);
                  });
                }
              });
              promise.resolve();
            }
          });
        } else {
          promise.resolve();
        }
      });
      return promise.promise;
    }
  , destroySync: function (seed) {
    var promise = new Seed.Promise()
      , self = this;
    if (this.err) {
      promise.reject(this.err);
      return promise.promise;
    }

    var id = seed.data.id
      , file = path.join(this.path, seed.collection, id + '.json')
      , exists = _existsSync(file);
    if (exists) {
      fs.unlinkSync(file);
      var files = fs.readdirSync(path.dirname(file));
      if (files.length == 0) {
        fs.rmdirSync(path.dirname(file));
      }
    }
    promise.resolve();
    return promise.promise;
  }

  , sync: function (action, model, query) {
    var data = (model) ? model._attributes : null
      , collection = model.type
      , act = action + (this.useSync ? 'Sync' : '');
    var oath = this[act]({
      data: data,
      collection: collection,
      query: query || {}
    });
    return oath;
  }
});

module.exports = FileStore;
