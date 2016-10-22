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

/*
 * test module
 */
describe('empty directory', function() {

  var ROOT = __dirname;

  describe('issue10 - error handling crash', function() {

    it('should create another dir inside ROOT path', function(done) {

      fs.mkdir(ROOT + '/foobar', done);
    });
    it('should save nothing, because path is empty (corrupt bson message)',
      function(done) {

        restore({
          uri: URI,
          root: ROOT,
          metadata: true,
          callback: function(err) {

            assert.equal(err, null);
            done();
          }
        });
      });
    it('should save nothing, because path is empty (corrupt json message)',
      function(done) {

        restore({
          uri: URI,
          root: ROOT,
          parser: 'json',
          metadata: true,
          callback: function(err) {

            assert.equal(err, null);
            done();
          }
        });
      });
    it('should delete dir inside ROOT path', function(done) {

      fs.rmdir(ROOT + '/foobar', done);
    });
  });
});
