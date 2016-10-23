'use strict';
/**
 * @file indexes test
 * @module mongodb-restore
 * @subpackage test
 * @version 0.0.1
 * @author hex7c0 <hex7c0@gmail.com>
 * @license GPLv3
 */

/*
 * initialize module
 */
var restore = require('..');
var backup = require('mongodb-backup');
var assert = require('assert');
var fs = require('fs');
var client = require('mongodb').MongoClient;
var URI = process.env.URI; // restore to here
var URI2 = process.env.URI2; // backup from here

/*
 * test module
 */
describe('indexes', function() {

  var ROOT = __dirname + '/foobar/';
  var COLLECTION = 'foobar_ix';
  var INDEXES = [];
  var FILES = [];
  var DIRS = [];

  describe('init', function() {

    it('should create another dir inside ROOT path if missing', function(done) {

      fs.stat(ROOT, function(err) {

        if (err) {
          fs.mkdir(ROOT, done);
        }
      });
    });
    it('should drop collection and create another', function(done) {

      client.connect(URI2, function(err, db) {

        db.dropCollection(COLLECTION, function(err, result) {

          // raise err if missing (already deleted)

          db.createCollection(COLLECTION, function(err, collection) {

            assert.ifError(err);
            var docs = [ {
              loc: {
                type: 'Point',
                coordinates: [ -73.97, 40.77 ]
              },
              name: 'Central Park',
              category: 'Parks'
            }, {
              loc: {
                type: 'Point',
                coordinates: [ -73.88, 40.78 ]
              },
              name: 'La Guardia Airport',
              category: 'Airport'
            } ];

            collection.insertMany(docs, {
              w: 1
            }, function(err, result) {

              assert.ifError(err);
              assert.equal(result.insertedCount, 2);

              collection.createIndex({
                loc: '2dsphere'
              }, function(err, indexName) {

                assert.ifError(err);
                assert.equal(indexName, 'loc_2dsphere');

                collection.indexes(function(err, indexes) {

                  assert.ifError(err);
                  assert.equal(indexes.length, 2);
                  assert.equal(indexes[0].name, '_id_');
                  assert.equal(indexes[0].key['_id'], '1');
                  delete (indexes[0].ns); // different dbName
                  assert.deepEqual(Object.keys(indexes[0].key), [ '_id' ]);
                  assert.equal(indexes[1].name, 'loc_2dsphere');
                  assert.equal(indexes[1].key['loc'], '2dsphere');
                  assert.deepEqual(Object.keys(indexes[1].key), [ 'loc' ]);
                  delete (indexes[1].ns); // different dbName

                  INDEXES = indexes;
                  done();
                });
              });
            });
          });
        });
      });
    });
    it('should backup this collection', function(done) {

      backup({
        uri: URI2,
        root: ROOT,
        collections: [ COLLECTION ],
        metadata: true,
        callback: function(err) {

          assert.ifError(err);
          var dirs = fs.readdirSync(ROOT);
          assert.equal(dirs.length, 1);

          /*
           * path
           */
          var database = ROOT + dirs[0];
          assert.equal(fs.statSync(database).isDirectory(), true);

          var collections = fs.readdirSync(database);
          assert.equal(collections.length, 2, 'collection + .metadata');
          assert.equal(collections[0], '.metadata');
          assert.equal(collections[1], COLLECTION);

          var metadata = database + '/' + collections[0];
          var collection = database + '/' + collections[1];

          /*
           * metadata
           */
          assert.equal(fs.statSync(metadata).isDirectory(), true);
          var collectionsMetadata = fs.readdirSync(metadata);
          assert.equal(collectionsMetadata.length, 1);
          assert.equal(collectionsMetadata[0], COLLECTION);
          assert.equal(fs.statSync(metadata + '/' + collectionsMetadata[0])
              .isFile(), true);

          try {
            var doc = JSON.parse(fs.readFileSync(metadata + '/' + COLLECTION));
          } catch (err) {
            assert.ifError(err);
          }
          delete (doc[0].ns); // different dbName
          delete (doc[1].ns); // different dbName
          assert.deepEqual(doc, INDEXES);

          /*
           * data
           */
          assert.equal(fs.statSync(collection).isDirectory(), true);
          var collectionData = fs.readdirSync(collection);
          assert.equal(collectionData.length, 2);
          assert.equal(fs.statSync(collection + '/' + collectionData[0])
              .isFile(), true);
          assert.equal(collectionData[0].substr(-5), '.bson');
          assert.equal(fs.statSync(collection + '/' + collectionData[1])
              .isFile(), true);
          assert.equal(collectionData[1].substr(-5), '.bson');

          DIRS.push(collection);
          DIRS.push(metadata);
          DIRS.push(database);
          DIRS.push(ROOT);
          ROOT = database;

          FILES.push(collection + '/' + collectionData[1]);
          FILES.push(collection + '/' + collectionData[0]);
          FILES.push(metadata + '/' + collectionsMetadata[0]);

          done();
        }
      });
    });
  });

  describe('restore', function() {

    it('should drop collection before restore', function(done) {

      client.connect(URI, function(err, db) {

        assert.ifError(err);
        db.dropCollection(COLLECTION, function(err, result) {

          // raise err if missing (already deleted)
          done();
        });
      });
    });
    it('should restore this collection', function(done) {

      restore({
        uri: URI,
        root: ROOT,
        logger: 'foo',
        metadata: true,
        dropCollections: [ COLLECTION ],
        callback: function(err) {

          assert.ifError(err, null);
          setTimeout(done, 500); // time for mongod
        }
      });
    });
    it('should have 2 indexes', function(done) {

      client.connect(URI, function(err, db) {

        assert.ifError(err);
        db.collection(COLLECTION, function(err, collection) {

          assert.ifError(err);
          collection.indexes(function(err, indexes) {

            assert.ifError(err);
            assert.equal(indexes.length, 2);
            assert.equal(indexes[0].name, '_id_');
            assert.equal(indexes[0].key['_id'], '1');
            assert.deepEqual(Object.keys(indexes[0].key), [ '_id' ]);
            delete (indexes[0].ns); // different dbName
            assert.equal(indexes[1].name, 'loc_2dsphere');
            assert.equal(indexes[1].key['loc'], '2dsphere');
            assert.deepEqual(Object.keys(indexes[1].key), [ 'loc' ]);
            delete (indexes[1].ns); // different dbName

            assert.deepEqual(indexes, INDEXES);

            done();
          });
        });
      });
    });
  });

  describe('clear', function() {

    it('should remove all files', function(done) {

      for (var i = 0, ii = FILES.length; i < ii; ++i) {
        fs.unlinkSync(FILES[i]);
      }
      done();
    });
    it('should remove all dirs', function(done) {

      for (var i = 0, ii = DIRS.length; i < ii; ++i) {
        fs.rmdirSync(DIRS[i]);
      }
      done();
    });
  });
});
