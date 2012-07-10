var Seed;

try {
  Seed = require('seed');
} catch (err) {
  console.error('Cannot find module seed. Is it installed?');
  process.exit(1);
}

var proto = require('./store/proto');
module.exports = Seed.Store.extend(proto, { version: '0.3.0' });
