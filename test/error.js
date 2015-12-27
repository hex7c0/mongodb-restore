'use strict';
/**
 * @file error test
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

/*
 * test module
 */
describe('error', function() {

  it('should return missing uri', function(done) {

    var mex = /missing uri option/;
    assert.throws(function() {

      restore();
    }, mex);
    assert.throws(function() {

      restore({});
    }, mex);
    assert.throws(function() {

      restore({
        root: 'ciao'
      });
    }, mex);
    done();
  });
  it('should return parser root', function(done) {

    var mex = /missing parser option/;
    assert.throws(function() {

      restore({
        uri: 'ciao',
        root: __dirname,
        parser: 'ciao'
      });
    }, mex);
    done();
  });
  it('should return wrong uri', function(done) {

    var mex = /invalid schema, expected mongodb/;
    assert.throws(function() {

      restore({
        uri: 'ciao',
        root: __dirname
      });
    }, mex);
    done();
  });

  describe('root', function() {

    it('should return missing root', function(done) {

      var mex = /missing root option/;
      assert.throws(function() {

        restore({
          uri: 'ciao'
        });
      }, mex);
      done();
    });
    it('should return wrong root (not exists)', function(done) {

      var mex = /root option is not a directory/;
      assert.throws(function() {

        restore({
          uri: 'ciao',
          root: 'ciao'
        });
      }, mex);
      done();
    });
    it('should return different error message (exists)', function(done) {

      var mex = /root option is not a directory/;
      assert.throws(function() {

        restore({
          uri: 'ciao',
          root: __dirname + 'error.js'
        });
      }, mex);
      done();
    });
    it('should return wrong root (not dir)', function(done) {

      var mex = 'root option is not a directory';
      assert.throws(function() {

        restore({
          uri: 'ciao',
          root: __dirname + '/error.js'
        });
      }, mex);
      done();
    });
  });
});
