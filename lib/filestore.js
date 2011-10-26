/*!
 * seed - memory store # extends Seed/store.js
 * Copyright(c) 2011 Jake Luer <@jakeluer>
 * MIT Licensed
 */

// npm modules
var fs = require('fs')
  , path = require('path')
  , tea = require('tea')
  , oath = require('oath');

// seed modules
var Store = require('seed')._Store;

// uid creator
var uid = new tea.UID();


/**
 * # Store
 * 
 * The default store template that can be extended 
 * by storage engines. Declares default sync option.
 * 
 * @api prototype
 */

function FileStore (_path, options) {
  if (!_path) throw new Error('Seed FileStore requires a path.');
  if (!path.existsSync(_path)) throw new Error('Seed FileStore path does not exist: ' + _path);
  options = options || {};
  this.path = _path;
}

/*!
 * Merge with `Store' prototype
 */

tea.merge(FileStore.prototype, Store.prototype);


/**
 * # .sync()
 * 
 * The default store template that can be extended 
 * by storage engines. Declares default sync option.
 * 
 * @param {String} action (get | set | destroy)
 * @param {Object} model instance of seed.model
 * @api public
 */

FileStore.prototype.sync = function (action, seed) {
  if (action == 'fetch') {
    var path = seed.path
      , oath = this.fetch(path);
    
    return oath;
  } else {
    var data = seed._attributes
      , path = seed.path || seed.collection.path;
    
    var oath = this[action]({
      data: data,
      path: path || ''
    });
    
    return oath;
  }
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

FileStore.prototype.set = function (seed) {
  var promise = new oath(),
      self = this;
  
  var id = seed.data.id;
  if (!id) {
    id = uid.gen();
    seed.data.id = id;
  }
  
  var file = path.join(this.path, seed.path, id + '.json')
    , data = JSON.stringify(seed.data);
  
  tea.mkdir(path.dirname(file), function(err) {
    if (err) {
      promise.reject({code: 0, message: 'An unkown directory error occurred'});
      return;
    }
    
    fs.writeFile(file, data, function (err) {
      if (err) {
        promise.reject({code: 0, message: 'An unkown file error occurred'});
      } else {
        promise.resolve(seed.data);
      }
    });
  });
  
  
  return promise;
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

FileStore.prototype.get = function (seed) {
  var promise = new oath(),
      self = this;
  
  var id = seed.data.id
    , file = path.join(this.path, seed.path, id + '.json')
    , data;
  
  path.exists(file, function (exists) {
    if (!exists) {
      promise.reject({ code: 3, message: 'seed doesn\'t exist on server'});
      return;
    } else {
      data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      promise.resolve(data);
    }
  });
  
  return promise;
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

FileStore.prototype.fetch = function (_path) {
  var promise = new oath(),
      self = this;
  
  var dir = path.join(this.path, _path)
    , data = [], count = 0;
  
  path.exists(dir, function (exists) {
    if (!exists) {
      promise.reject({ code: 3, message: 'seed doesn\'t exist on server'});
      return;
    } else {
      fs.readdir(dir, function (err, files) {
        if (err) return promise.reject({ code: 3, message: 'seed doesn\'t exist on server'});
        
        var after = function () {
          count++;
          if (count == files.length)
            promise.resolve(data);
        };
        
        files.forEach(function(file) {
          var _json = path.join(self.path, _path, file);
          
          fs.stat(_json, function (err, stat) {
            if (stat && !stat.isDirectory()) {
              data.push(JSON.parse(fs.readFileSync(_json, 'utf-8')));
            }
            after();
          });
        });
      });
    }
  });
  
  return promise;
};

/**
 * # .destroy()
 * 
 * Delete: Remove an entry from the database. Emits
 * an error message if no Id in object or object doesn't
 * exist.
 * 
 * @public {Object} seed prepared model from sync.
 * @api public
 */

FileStore.prototype.destroy = function (seed) {
  var promise = new oath(),
      self = this;
  
  var id = seed.data.id
    , file = path.join(this.path, seed.path, id + '.json');
  
  process.nextTick(function() {
    var id = seed.data.id;
    if (!id) { promise.reject({ code: 1, message: 'can\'t read without an id' }); return; }
    
    path.exists(file, function (exists) {
      if (!exists) {
        promise.reject({ code: 3, message: 'seed doesn\'t exist on server'});
        return;
      } else {
        fs.unlink(file, function (err) {
          if (err) {
            promise.reject({ code: 3, message: 'an unknown file deletion error occured'});
            return;
          } else {
            promise.resolve(id);
          }
        });
      }
    });
  });
  
  return promise;
};

/*!
 * Export main object
 */

var exports = module.exports = FileStore;

exports.version = '0.0.2';