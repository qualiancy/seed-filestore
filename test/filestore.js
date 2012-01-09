var should = require('chai').should();

var Seed = require('seed')
  , FileStore = require('..');

var path = require('path')
  , fs = require('fs');

describe('Seed FileStore', function () {

  var dir = path.join(__dirname, 'data')
    , Store = new FileStore({ path: dir });

  it('should have a version', function () {
    FileStore.version.should.match(/^\d+\.\d+\.\d+$/);
  });

  describe('Models', function () {

    var Person = Seed.Model.extend('traveller', {
      store: Store
    });

    var arthur = new Person({
      name: 'Arthur Dent',
      occupation: 'traveller'
    });

    it('should allow saving', function (done) {
      arthur.save(function (err) {
        var id = this.id;
        should.not.exist(err);
        done();
      });
    });

  });

});


/*
module.exports = new Sherlock.Investigation('Seed FileStore', function (test, done) {

  var _path = path.join(__dirname, 'data')
    , Store = new FileStore(_path);


  test('Store -> Seed#model', function (test, done) {
    var Person = Seed.Model.extend('traveller', {
      store: Store
    });

    var arthur = new Person({
      name: 'Arthur Dent',
      occupation: 'traveller'
    });

    test('can be set', function (test, done) {
      arthur.save(function(err, data) {
        var id = this.id;

        assert.isNull(err);
        assert.isNotNull(this.id);
        assert.ok(path.existsSync(path.join(_path, this.type, id + '.json')));

        test('can be retrieved', function (test, done) {
          var traveller = new Person({
            id: id
          });

          traveller.fetch(function(err) {
            assert.isNull(err);
            assert.equal(traveller.get('name'), 'Arthur Dent');

            test('can be removed', function (test, done) {
              traveller.destroy(function (err) {
                assert.isNull(err);
                assert.ok(!path.existsSync(path.join(_path, this.type, id + '.json')));
                fs.rmdirSync(path.join(_path, this.type));
                done();
              });

            });

            done();
          });

        });

        done();
      });
    });

    done();
  });

  test('Store -> Seed#graph', function (test, done) {
    var Person = Seed.Model.extend('person');

    var arthur = {
      name: 'Arthur Dent',
      occupation: 'traveller'
    };

    var ford = {
      name: 'Ford Prefect',
      occupation: 'writer'
    };

    var earth = new Seed.Graph({
      store: Store
    });

    earth.define(Person);

    earth.set('/person/arthur', arthur);
    earth.set('/person/ford', ford);

    test('models can be added', function (test, done) {
      earth.push(function (err) {
        assert.isNull(err);
        assert.ok(path.existsSync(path.join(_path, 'person', 'arthur.json')));
        assert.ok(path.existsSync(path.join(_path, 'person', 'ford.json')));

        var arthur_id = arthur.id
          , ford_id = ford.id;


        test('models can be pulled', function (test, done) {
          var starship = new Seed.Graph({
            store: Store
          });

          starship.define(Person);

          starship.set('/person/arthur');
          starship.set('/person/ford');

          starship.pull(function (err) {
            assert.isNull(err);
            assert.equal(starship.count, 2);
            done();
          });

        });

        test('models can be fetched', function (test, done) {
          var starship = new Seed.Graph({
            store: Store
          });

          starship.define(Person);

          starship.fetch('person', function (err) {
            assert.isNull(err);
            assert.equal(starship.count, 2);
            done();
          });

        });

        done(function () {
          fs.unlinkSync(path.join(_path, 'person', 'arthur.json'));
          fs.unlinkSync(path.join(_path, 'person', 'ford.json'));
          fs.rmdirSync(path.join(_path, 'person'));
        });
      });
    });

    done();
  });


  done();
});

*/