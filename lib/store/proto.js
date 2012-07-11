var fs = require('fsagent')
  , path = require('path')
  , Seed = require('seed')
  , Store = Seed.Store
  , uid = new Seed.ObjectId();

var proto = module.exports = {};

proto.name = 'FileStore';

proto.initialize = function (path) {
  this.path = path;

  if (!this.path || !fs.existsSync(this.path)) {
    this._err = new Error('Invalid path provided to Seed FileStore');
    this.emit('error', this._err);
  }
};

/**
 * # .get()
 *
 * Read: Get the value of an entry in the store
 * given an ID.
 *
 * @public {Object} seed prepared model from sync.
 * @api public
 */

proto.get = function (seed) {
  var defer = new Seed.Promise();

  if (this._err) {
    defer.reject(this._err);
    return defer.promise;
  }

  var id = seed.data._id
    , file = path.join(this.path, seed.collection, id + '.json');

  fs.exists(file, function (exists) {
    if (!exists) return defer.resolve(undefined);
    fs.readFile(file, 'utf8', function (err, raw) {
      if (err) return defer.reject(err);
      var data = JSON.parse(raw);
      defer.resolve(data);
    });
  });

  return defer.promise;
};

/**
 * # .set()
 *
 * Create or update: Set the whole value of an entry
 * in the store. Creates an ID if one does not exist.
 *
 * @public {Object} seed prepared model from sync.
 * @api public
 */

proto.set = function (seed) {
  var defer = new Seed.Promise();

  if (this._err) {
    defer.reject(this._err);
    return defer.promise;
  }

  var id = seed.data._id;
  if (!id) {
    id = uid.gen();
    seed.data._id = id;
  }

  var file = path.join(this.path, seed.collection, id + '.json')
    , data = JSON.stringify(seed.data);

  fs.mkdirp(path.dirname(file), function(err) {
    if (err) return defer.reject(err);
    fs.writeFile(file, data, 'utf8', function (err) {
      if (err) return defer.reject(err);
      defer.resolve(seed.data);
    });
  });

  return defer.promise;
};

/**
 * # .fetch()
 *
 * Read: Get the value of an entry in the store
 * given an ID.
 *
 * @public {Object} seed prepared model from sync.
 * @api public
 */

proto.fetch = function (seed) {
  var defer = new Seed.Promise()
    , self = this;

  if (this._err) {
    defer.reject(this._err);
    return defer.promise;
  }

  var dir = path.join(this.path, seed.collection)
    , data = [];

  fs.exists(dir, function (exists) {
    if (!exists) return defer.resolve([]);
    fs.readdir(dir, function (err, files) {
      if (err) return defer.reject(err);

      // queue iterator: async load file contents
      function iterator (file, next) {
        if (path.extname(file).toLowerCase() !== '.json') return next();
        var filename = path.join(dir, file);
        fs.stat(filename, function (err, stat) {
          if (err) return next(err);
          if (stat.isFile()) {
            fs.readFile(filename, 'utf8', function (err, raw) {
              if (err) return next(err);
              try { var json = JSON.parse(raw); }
              catch (ex) { return next(ex); }
              data.push(json);
              next();
            });
          }
        });
      }

      // queue error handler
      function handleErr (err) {
        defer.reject(err);
      }

      // queue drain handler (completed)
      function handleDrain () {
        var q = new Seed.Query(seed.query)
          , res = q.test(data);
        defer.resolve(res);
      }

      // build our queue
      var queue = Seed.async.queue(iterator, 10);
      queue.onerror = handleErr;
      queue.drain = handleDrain;
      queue.push(files);
      queue.process();
    });
  });

  return defer.promise;
};

proto.destroy = function (seed) {
  var defer = new Seed.Promise()
    , self = this;

  if (this._err) {
    defer.reject(this._err);
    return defer.promise;
  }

  var id = seed.data._id
    , file = path.join(this.path, seed.collection, id + '.json');

  fs.exists(file, function (exists) {
    if (!exists) return defer.resolve();
    fs.unlink(file, function (err) {
      if (err) return defer.reject(err);
      defer.resolve();
      var dir = path.dirname(file);
      fs.readdir(dir, function (err, files) {
        if (files.length) return;
        fs.rmdir(dir, function (err) {
          if (err) self.emit('error', err);
        });
      });
    });
  });

  return defer.promise;
};
