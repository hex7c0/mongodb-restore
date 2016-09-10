'use strict';
/**
 * @file 1 test
 * @module mongodb-restore
 * @subpackage test
 * @version 0.0.1
 * @author hex7c0 <hex7c0@gmail.com>
 * @license GPLv3
 */

/*
 * initialize module
 */
var backup = require('mongodb-backup');
var assert = require('assert');
var fs = require('fs');
var client = require('mongodb').MongoClient;
var URI = process.env.URI;
var URI2 = process.env.URI2;

/*
 * test module
 */
describe('start', function() {

  var ROOT = __dirname + '/dump';

  describe('mongodb-backup', function() {

    describe('directory', function() {

      it('should build 1 directory and drop database', function(done) {

        backup({
          uri: URI2,
          root: ROOT,
          collections: [ 'auths' ],
          metadata: true,
          callback: function(err) {

            assert.ifError(err);
            fs.readdirSync(ROOT).forEach(function(first) { // database

              var database = ROOT + '/' + first;
              assert.equal(fs.statSync(database).isDirectory(), true);
              var second = fs.readdirSync(database);
              assert.equal(second.indexOf('auths') >= 0, true);
            });
            done();
          }
        });
      });
    });

    describe('tar', function() {

      var path0 = ROOT + '/t1.tar';
      var path1 = ROOT + '/t_stream.tar';

      it('should make a tar file', function(done) {

        backup({
          uri: URI2,
          root: ROOT,
          tar: 't1.tar',
          callback: function(err) {

            assert.ifError(err);
            assert.equal(fs.existsSync(path0), true);
            done();
          }
        });
      });
      it('should make a tar file for stream', function(done) {

        backup({
          uri: URI2,
          root: ROOT,
          collections: [ 'logins' ],
          tar: 't_stream.tar',
          callback: function(err) {

            assert.ifError(err);
            assert.equal(fs.existsSync(path1), true);
            done();
          }
        });
      });
    });
  });
});
