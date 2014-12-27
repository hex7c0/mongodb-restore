'use strict';
/**
 * @file parser test
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
  var URI = process.env.URI;
} catch (MODULE_NOT_FOUND) {
  console.error(MODULE_NOT_FOUND);
  process.exit(1);
}

/*
 * test module
 */
describe('parser', function() {

  var ROOT = __dirname + '/dump';

  it('should check custom parser', function(done) {

    var c = 0;
    restore({
      uri: URI,
      root: ROOT,
      collections: [ 'logins' ],
      parser: function(collections, name, next) {

        c++;
        assert.equal(typeof collections, 'object');
        assert.equal(typeof name, 'string');
        assert.equal(typeof next, 'function');
        next();
      },
      callback: function() {

        assert.equal(c > 0, true);
        done();
      }
    });
  });
});
