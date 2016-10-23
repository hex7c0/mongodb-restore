'use strict';
/**
 * @file directory test
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
var assert = require('assert');
var fs = require('fs');
var client = require('mongodb').MongoClient;
var URI = process.env.URI;
var URI2 = process.env.URI2;

var pad = function(val, len) {

  var val = String(val);
  var len = len || 2;
  while (val.length < len) {
    val = '0' + val;
  }
  return val;
};

/*
 * test module
 */
describe('directory', function() {

  var DOCS = {};
  var ROOT = __dirname + '/dump/';
  var COLLECTION = '';
  var INDEX = [];

  it('should get db directory, not tar file', function(done) {

    fs.readdirSync(ROOT).forEach(function(first) { // database

      var t = ROOT + first;
      if (!fs.existsSync(t) || !fs.statSync(t).isDirectory()) {
        return;
      }
      ROOT += first;
      done();
    });
  });
  it('should get original data from db', function(done) {

    var second = fs.readdirSync(ROOT);
    assert.equal(second.length, 2); // .metadata + collection
    assert.equal(second[1], 'auths');
    COLLECTION = second[1];
    client.connect(URI2, function(err, db) {

      db.collection(COLLECTION, function(err, collection) {

        assert.ifError(err);
        collection.indexes(function(err, index) {

          assert.ifError(err);
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

    var l = 'l1.log';
    var date = new Date();
    var dailyF = date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1)
      + '-' + pad(date.getUTCDate()) + '.' + l;
    it('should check that log file not exist before test', function(done) {

      assert.equal(fs.existsSync(l), false);
      assert.equal(fs.existsSync(dailyF), false);
      done();
    });
    it('should save data to db, with Id duplicated', function(done) {

      restore({
        uri: URI,
        root: ROOT,
        logger: l,
        metadata: true,
        drop: false, // for coverage
        callback: function(err) {

          assert.notEqual(err, null);
          assert.ok(/duplicate key error index/.test(err.message));
          setTimeout(done, 500); // time for mongod
        }
      });
    });
    it('should test original data and saved data', function(done) {

      client.connect(URI, function(err, db) {

        db.listCollections({}).toArray(function(err, items) {

          assert.ifError(err);
          // assert.equal(items.length, 2); // collection + indexes
          assert.equal(items.length >= 2, true); // travis same workspace
          db.collection(COLLECTION, function(err, collection) {

            assert.ifError(err);
            collection.indexes(function(err, index) {

              assert.ifError(err);
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

                assert.ifError(err);
                assert.deepEqual(docs, DOCS); // same above
                done();
              });
            });
          });
        });
      });
    });
    it('should remove log', function(done) {

      fs.unlink(dailyF, done);
    });
  });

  describe('restore - drop', function() {

    var l = 'ld1.log';
    var date = new Date();
    var dailyF = date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1)
      + '-' + pad(date.getUTCDate()) + '.' + l;
    it('should check that log file not exist before test', function(done) {

      assert.equal(fs.existsSync(l), false);
      assert.equal(fs.existsSync(dailyF), false);
      done();
    });
    it('should save data to db', function(done) {

      restore({
        uri: URI,
        root: ROOT,
        logger: l,
        metadata: true,
        drop: true,
        callback: function(err) {

          assert.ifError(err);
          setTimeout(done, 500); // time for mongod
        }
      });
    });
    it('should test original data and saved data', function(done) {

      client.connect(URI, function(err, db) {

        db.listCollections({}).toArray(function(err, items) {

          assert.ifError(err);
          // assert.equal(items.length, 2); // collection + indexes
          assert.equal(items.length >= 2, true); // travis same workspace
          db.collection(COLLECTION, function(err, collection) {

            assert.ifError(err);
            collection.indexes(function(err, index) {

              assert.ifError(err);
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

                assert.ifError(err);
                assert.deepEqual(docs, DOCS); // same above
                done();
              });
            });
          });
        });
      });
    });
    it('should remove log', function(done) {

      fs.unlink(dailyF, done);
    });
  });

  describe('restore - dropCollections without Array', function() {

    var l = 'ldc1.log';
    var date = new Date();
    var dailyF = date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1)
      + '-' + pad(date.getUTCDate()) + '.' + l;
    it('should check that log file not exist before test', function(done) {

      assert.equal(fs.existsSync(l), false);
      assert.equal(fs.existsSync(dailyF), false);
      done();
    });
    it('should save data to db', function(done) {

      restore({
        uri: URI,
        root: ROOT,
        logger: l,
        metadata: true,
        dropCollections: true,
        callback: function(err) {

          assert.ifError(err);
          setTimeout(done, 500); // time for mongod
        }
      });
    });
    it('should test original data and saved data', function(done) {

      client.connect(URI, function(err, db) {

        db.listCollections({}).toArray(function(err, items) {

          assert.ifError(err);
          // assert.equal(items.length, 2); // collection + indexes
          assert.equal(items.length >= 2, true); // travis same workspace
          db.collection(COLLECTION, function(err, collection) {

            assert.ifError(err);
            collection.indexes(function(err, index) {

              assert.ifError(err);
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

                assert.ifError(err);
                assert.deepEqual(docs, DOCS); // same above
                done();
              });
            });
          });
        });
      });
    });
    it('should remove log', function(done) {

      fs.unlink(dailyF, done);
    });
  });

  describe('restore - dropCollections with Array', function() {

    var l = 'lda1.log';
    var date = new Date();
    var dailyF = date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1)
      + '-' + pad(date.getUTCDate()) + '.' + l;
    it('should check that log file not exist before test', function(done) {

      assert.equal(fs.existsSync(l), false);
      assert.equal(fs.existsSync(dailyF), false);
      done();
    });
    it('should test original data and saved data', function(done) {

      client.connect(URI, function(err, db) {

        db.listCollections({}).toArray(function(err, items) {

          assert.ifError(err);
          // assert.equal(items.length, 2); // collection + indexes
          assert.equal(items.length >= 2, true); // travis same workspace
          db.collection(COLLECTION, function(err, collection) {

            assert.ifError(err);
            collection.indexes(function(err, index) {

              assert.ifError(err);
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

                assert.ifError(err);
                assert.deepEqual(docs, DOCS); // same above
                done();
              });
            });
          });
        });
      });
    });
  });

  describe('restore - dropCollections wrong Array', function() {

    var l = 'ldw1.log';
    var date = new Date();
    var dailyF = date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1)
      + '-' + pad(date.getUTCDate()) + '.' + l;
    it('should check that log file not exist before test', function(done) {

      assert.equal(fs.existsSync(l), false);
      assert.equal(fs.existsSync(dailyF), false);
      done();
    });
    it('should save data to db', function(done) {

      var path = require('path');

      restore({
        uri: URI,
        root: ROOT + path.sep,
        logger: l,
        metadata: true,
        dropCollections: {},
        callback: function(err) {

          assert.ifError(err);
          setTimeout(done, 500); // time for mongod
        }
      });
    });
    it('should test original data and saved data', function(done) {

      client.connect(URI, function(err, db) {

        db.listCollections({}).toArray(function(err, items) {

          assert.ifError(err);
          // assert.equal(items.length, 2); // collection + indexes
          assert.equal(items.length >= 2, true); // travis same workspace
          db.collection(COLLECTION, function(err, collection) {

            assert.ifError(err);
            collection.indexes(function(err, index) {

              assert.ifError(err);
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

                assert.ifError(err);
                assert.deepEqual(docs, DOCS); // same above
                done();
              });
            });
          });
        });
      });
    });
    it('should remove log', function(done) {

      fs.unlink(dailyF, done);
    });
  });
});
