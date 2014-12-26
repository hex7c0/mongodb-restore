'use strict';
/**
 * @file 1 test
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
  var backup = require('mongodb-backup');
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
describe('start', function() {

  var ROOT = __dirname + '/dump';
  this.timeout(5000);

  describe('init', function() {

    it('should drop all database for correct tests', function(done) {

      client.connect(URI, function(err, db) {

        db.dropDatabase(function(err, collection) {

          assert.equal(err, null);
          db.close();
          done();
        });
      });
    });
  });

  describe('mongodb-backup', function() {

    describe('directory', function() {

      it('should build 1 directory', function(done) {

        backup({
          uri: URI2,
          root: ROOT,
          collections: [ 'auths' ],
          metadata: true,
          callback: function() {

            fs.readdirSync(ROOT).forEach(function(first) { // database

              var database = ROOT + '/' + first;
              if (fs.statSync(database).isDirectory() === false) {
                return;
              }
              var second = fs.readdirSync(database);
              assert.equal(second.indexOf('auths') >= 0, true);
            });
            done();
          }
        });
      });
    });

    describe('tar', function() {

      var path = ROOT + '/t1.tar';
      it('should make a tar file', function(done) {

        backup({
          uri: URI2,
          root: ROOT,
          tar: 't1.tar',
          callback: function() {

            assert.equal(fs.existsSync(path), true);

            done();
          }
        });
      });
    });
  });
});
