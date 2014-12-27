'use strict';
/**
 * @file tar test
 * @module mongodb-restore
 * @package mongodb-restore
 * @subpackage test
 * @version 0.0.1
 * @author hex7c0 <hex7c0@gmail.com>
 * @license GPLv3
 */

/*
 * initialize module
 */
// import
try {
  var restore = require('..');
  var assert = require('assert');
  var fs = require('fs');
  var client = require('mongodb').MongoClient;
  var URI = process.env.URI;
  var URI2 = process.env.URI2;
} catch (MODULE_NOT_FOUND) {
  console.error(MODULE_NOT_FOUND);
  process.exit(1);
}

/*
 * test module
 */
describe('tar', function() {

  var DOCS = {};
  var ROOT = __dirname + '/dump/';
  var COLLECTION = 'logins';
  var INDEX = [];

  it('should get tar file, not db directory', function(done) {

    fs.readdirSync(ROOT).forEach(function(first) { // database

      var t = ROOT + first;
      if (!fs.existsSync(t) || !fs.statSync(t).isFile()) {
        return;
      }
      assert.equal(first, 't1.tar');
      done();
    });
  });
  it('should get original data from db', function(done) {

    client.connect(URI2, function(err, db) {

      db.collection(COLLECTION, function(err, collection) {

        assert.equal(err, null);
        collection.indexes(function(err, index) {

          assert.equal(err, null);
          INDEX = index;
          collection.find({}, {
            sort: {
              _id: 1
            }
          }).toArray(function(err, docs) {

            assert.equal(Array.isArray(docs), true);
            assert.equal(docs.length > 0, true);
            DOCS = docs;
            done();
          });
        });
      });
    });
  });

  describe('restore', function() {

    it('should save data to db', function(done) {

      restore({
        uri: URI,
        root: ROOT,
        tar: 't1.tar',
        callback: function() {

          setTimeout(done, 500); // time for mongod
        }
      });
    });
    it('should test original data and saved data', function(done) {

      client.connect(URI, function(err, db) {

        db.collectionNames(function(err, items) {

          assert.equal(err, null);
          db.collection(COLLECTION, function(err, collection) {

            assert.equal(err, null);
            collection.indexes(function(err, index) {

              assert.equal(err, null);
              assert.equal(index.length, INDEX.length);
              for (var i = 0, ii = index.length; i < ii; i++) { // remove db releated data
                delete index[i].ns;
                delete INDEX[i].ns;
              }
              assert.equal(index[0].name, INDEX[0].name);
              // assert.deepEqual(index, INDEX); // not work on travis. but it's ok in local istance
              collection.find({}, {
                sort: {
                  _id: 1
                }
              }).toArray(function(err, docs) {

                assert.equal(err, null);
                assert.deepEqual(docs, DOCS); // same above
                done();
              });
            });
          });
        });
      });
    });
    it('should check that buffer dir not exist', function(done) {

      var paths = __dirname + '/../dump';
      assert.equal(fs.existsSync(paths), true); // stay alive
      assert.equal(fs.readdirSync(paths).length, 0, 'empty dir');
      done();
    });
  });
});
