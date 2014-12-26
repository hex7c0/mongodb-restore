'use strict';
/**
 * @file error test
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
} catch (MODULE_NOT_FOUND) {
  console.error(MODULE_NOT_FOUND);
  process.exit(1);
}

/*
 * test module
 */
describe('error', function() {

  it('should return missing uri', function(done) {

    var mex = 'missing uri option';
    try {
      restore();
    } catch (e) {
      assert.equal(e.message, mex);
    }
    try {
      restore({});
    } catch (e) {
      assert.equal(e.message, mex);
    }
    try {
      restore({
        root: 'ciao'
      });
    } catch (e) {
      assert.equal(e.message, mex);
    }
    done();
  });

  describe('root', function() {

    it('should return missing root', function(done) {

      var mex = 'missing root option';
      try {
        restore({
          uri: 'ciao'
        });
      } catch (e) {
        assert.equal(e.message, mex);
      }
      done();
    });
    it('should return wrong root (not exists)', function(done) {

      var mex = 'root option is not a directory';
      try {
        restore({
          uri: 'ciao',
          root: 'ciao'
        });
      } catch (e) {
        assert.equal(e.message, mex);
      }
      done();
    });
    it('should return different error message (exists)', function(done) {

      var mex = 'root option is not a directory';
      try {
        restore({
          uri: 'ciao',
          root: __dirname
        });
      } catch (e) {
        assert.notEqual(e.message, mex);
      }
      done();
    });
    it('should return wrong root (not dir)', function(done) {

      var mex = 'root option is not a directory';
      try {
        restore({
          uri: 'ciao',
          root: __dirname + '/error.js'
        });
      } catch (e) {
        assert.equal(e.message, mex);
      }
      done();
    });
  });

  it('should return parser root', function(done) {

    var mex = 'missing parser option';
    try {
      restore({
        uri: 'ciao',
        root: __dirname,
        parser: 'ciao'
      });
    } catch (e) {
      assert.equal(e.message, mex);
    }
    done();
  });
  it('should return wrong uri', function(done) {

    var mex = 'URL must be in the format mongodb://user:pass@host:port/dbname';
    try {
      restore({
        uri: 'ciao',
        root: __dirname
      });
    } catch (e) {
      assert.equal(e.message, mex);
    }
    done();
  });
});
