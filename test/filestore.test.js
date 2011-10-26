var Seed = require('seed')
  , FileStore = require('..')
  , Sherlock = require('sherlock')
  , assert = Sherlock.assert;

var path = require('path')
  , fs = require('fs');

module.exports = new Sherlock.Investigation('Seed FileStore', function (test, done) {
  
  var _path = path.join(__dirname, 'data')
    , Store = new FileStore(_path);
  
  test('FileStore#version', function (test, done) {
    assert.isNotNull(FileStore.version);
    done();
  });
  
  test('Store -> Seed#model', function (test, done) {
    var Person = Seed.Model.extend({ 
      store: Store,
      path: 'setmodel' 
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
        assert.ok(path.existsSync(path.join(_path, this.path, id + '.json')));
        
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
                assert.ok(!path.existsSync(path.join(_path, this.path, id + '.json')));
                fs.rmdirSync(path.join(_path, this.path));
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
  
  test('Store -> Seed#collection', function (test, done) {
    var Person = Seed.Model.extend({ 
      store: Store,
      path: 'setcollection' 
    });
    
    var arthur = new Person({
      name: 'Arthur Dent',
      occupation: 'traveller'
    });
    
    var ford = new Person({
      name: 'Ford Prefect',
      occupation: 'writer'
    });
    
    var earth = new Seed.Collection([arthur, ford], {
      model: Person,
      store: Store,
      path: 'setcollection' 
    });
    
    test('models can be added', function (test, done) {
      earth.push(function (err) {
        assert.isNull(err);
        assert.ok(path.existsSync(path.join(_path, this.path, arthur.id + '.json')));
        assert.ok(path.existsSync(path.join(_path, this.path, ford.id + '.json')));
        
        var arthur_id = arthur.id
          , ford_id = ford.id;
        
        test('models can be pulled', function (test, done) {
          var starship = new Seed.Collection([], {
            model: Person,
            store: Store,
            path: 'setcollection'
          });
          
          starship.create({ id: arthur_id });
          starship.create({ id: ford_id });
          
          starship.pull(function (err) {
            assert.isNull(err);
            assert.equal(starship.count, 2);
            done();
          });
          
        });
        
        test('models can be fetched', function (test, done) {
          var starship = new Seed.Collection([], {
            model: Person,
            store: Store,
            path: 'setcollection'
          });
          
          starship.fetch(function (err) {
            assert.isNull(err);
            assert.equal(starship.count, 2);
            done();
          });
          
        });
        
        done(function () {
          fs.unlinkSync(path.join(_path, 'setcollection', arthur_id + '.json'));
          fs.unlinkSync(path.join(_path, 'setcollection', ford_id + '.json'));
          fs.rmdirSync(path.join(_path, 'setcollection'));
        });
      });
    });
    
    done();
  });
  
  
  done();
});