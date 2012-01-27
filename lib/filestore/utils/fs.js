var path = require('path')
  , fs = require('fs')
  , exports = module.exports = {};

exports.isPathAbsolute = function (_path) {
  var abs = false;
  if ('/' == _path[0]) abs = true;
  if (':' == _path[1] && '\\' == _path[2]) abs = true;
  return abs;
};

exports.mkdir = function (_path, mode, callback) {
  var exst = path.exists || fs.exists;
  if ('function' === typeof mode) {
    callback = mode;
    mode = 0777;
  }
  callback = callback || function () {};
  _path = path.resolve(_path);
  function _mkdir(p, next) {
    var _p = path.normalize(p).split('/');
    exst(p, function (exists) {
      if (!exists) {
        _mkdir(_p.slice(0, -1).join('/'), function (err) {
          if (err) next(err);
          fs.mkdir(p, mode, function (err) {
            if (err) return next(err);
            next(null);
          });
        });
      } else {
        next(null);
      }
    });
  }

  _mkdir(_path, function(err) {
    if (err) callback(err);
    callback(null);
  });
};

exports.mkdirSync = function (_path, mode) {
  var exst = path.existsSync || fs.existsSync;
  _path = path.resolve(_path);
  function _mkdir(p) {
    var _p = path.normalize(p).split('/')
      , exists = exst(p);
    if (!exists) {
      _mkdir(_p.slice(0, -1).join('/'));
      fs.mkdirSync(p, mode);
    }
  }

  _mkdir(_path);
}
