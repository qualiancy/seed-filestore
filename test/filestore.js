var should = require('chai').should();

var Seed = require('seed')
  , FileStore = require('..');

var path = require('path')
  , fs = require('fsagent');

describe('Seed FileStore', function () {

  var dir = path.join(__dirname, 'data')
    , store = new FileStore(dir);

  it('should have a version', function () {
    FileStore.version.should.match(/^\d+\.\d+\.\d+$/);
  });

  describe('Models', function () {

    var Person = Seed.Model.extend('traveller', {
        store: store
    });

    var arthur = new Person({
        name: 'Arthur Dent'
      , occupation: 'traveller'
    });

    it('should allow saving', function (done) {
      arthur.save(function (err) {
        var id = arthur.id;
        should.not.exist(err);
        fs.existsSync(path.join(dir, arthur.type, id + '.json')).should.be.true;
        done();
      });
    });

    it('should allow retrieval', function (done) {
      var arthur2 = new Person({
          _id: arthur.id
      });

      arthur2.fetch(function (err) {
        should.not.exist(err);
        arthur2.get('name').should.equal(arthur.get('name'));
        done();
      });
    });

    it('should allow for removal', function (done) {
      arthur.destroy(function (err) {
        var id = this.id;
        should.not.exist(err);
        fs.existsSync(path.join(dir, this.type, id + '.json')).should.be.false;
        done();
      });
    });

  });

  describe('CRUD from Graph', function () {
    var graph = new Seed.Graph({
          store: store
        });

    var Person = Seed.Model.extend('person', {})
      , Location = Seed.Model.extend('location', {});

    graph.define(Person);
    graph.define(Location);

    var arthur = {
        _id: 'arthur'
      , name: 'Arthur Dent'
      , stats: {
            origin: 'Earth'
          , species: 'human'
        }
    };

    var ford = {
        _id: 'ford'
      , name: 'Ford Prefect'
      , stats: {
            origin: 'Betelgeuse-ish'
          , species: 'writer'
        }
    };

    var earth = {
        _id: 'earth'
      , name: 'Dent\'s Planet Earth'
    };

    var ship = {
        _id: 'gold'
      , name: 'Starship Heart of Gold'
    };

    beforeEach(function () {
      graph.flush();
    });

    it('should allow new objects to be created', function (done) {
      graph.set('person', arthur._id, arthur);
      graph.set('person', ford._id, ford);
      graph.set('location', earth._id, earth);
      graph.set('location', ship._id, ship);

      graph.push(function (err) {
        should.not.exist(err);
        done();
      });

    });

    it('should allow already existing objects to be read', function (done) {
      graph.set('person', arthur._id);
      graph.set('person', ford._id);
      graph.set('location', earth._id);
      graph.set('location', ship._id);

      graph.pull({ force: true }, function (err) {
        should.not.exist(err);
        graph.length.should.equal(4);

        var arthur2 = graph.get('person', 'arthur');
        arthur2._attributes.should.eql(arthur);
        arthur2.flag('dirty').should.be.false;
        done();
      });
    });

    it('should allow all records of a specific type to be fetched', function (done) {
      graph.fetch('person', function (err) {
        should.not.exist(err);
        graph.length.should.equal(2);

        var arthur2 = graph.get('person', 'arthur');
        arthur2._attributes.should.eql(arthur);
        arthur2.flag('dirty').should.be.false;
        done();
      });
    });

    it('can handle fetch that returns no results', function (done) {
      graph.fetch('person', { name: 'Marvin' }, function (err) {
        should.not.exist(err);
        graph.length.should.equal(0);
        done();
      });
    });

    it('should allow a subset of existing objects to be selected', function (done) {
      graph.fetch('person', { 'name': { $eq: 'Arthur Dent' } }, function (err) {
        should.not.exist(err);
        graph.length.should.equal(1);

        var arthur2 = graph.get('person', 'arthur');
        arthur2._attributes.should.eql(arthur);
        arthur2.flag('dirty').should.be.false;
        done();
      });
    });

    it('show allow an already existing object to be updated', function (done) {
      graph.fetch('person', function (err) {
        should.not.exist(err);
        graph.length.should.equal(2);

        var arthur2 = graph.get('person', 'arthur');
        arthur2._attributes.should.eql(arthur);
        arthur2.flag('dirty').should.be.false;
        arthur2.set('name', 'The Traveler');
        arthur2.flag('dirty').should.be.true;

        graph.push(function (err) {
          should.not.exist(err);
          done();
        });
      });
    })

    it('should allow an already existing object to be deleted', function (done) {
      // deletion is handled through the model interface. this is not currently needed.
      // perhaps in time, if mass deletion of purging is required.
      graph.set('person', arthur._id, arthur);
      graph.set('person', ford._id, ford);
      graph.set('location', earth._id, earth);
      graph.set('location', ship._id, ship);
      var count = 3;
      graph.each(function (model) {
        model.destroy(function (err) {
          should.not.exist(err);
          count-- || done();
        });
      });
    });

  });

});
