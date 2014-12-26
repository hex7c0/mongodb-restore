'use strict';
/**
 * @file z test
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
  var fs = require('fs');
} catch (MODULE_NOT_FOUND) {
  console.error(MODULE_NOT_FOUND);
  process.exit(1);
}

/*
 * test module
 */
describe('last', function() {

  var ROOT = __dirname + '/dump/';
  this.timeout(5000);

  describe('tar', function() {

    it('should unlink tar file', function(done) {

      fs.unlink(ROOT + 't1.tar', function() {

        done();
      });
    });
  });

  describe('directory', function() {

    function rmDir(path, next) {

      fs.readdirSync(path).forEach(function(first) { // database

        var database = path + first;
        if (fs.statSync(database).isDirectory() === false) {
          return;
        }
        var metadata = '';
        var collections = fs.readdirSync(database);
        if (fs.existsSync(database + '/.metadata') === true) {
          metadata = database + '/.metadata/';
          delete collections[collections.indexOf('.metadata')]; // undefined is not a dir
        }
        collections.forEach(function(second) { // collection

          var collection = database + '/' + second;
          if (fs.statSync(collection).isDirectory() === false) {
            return;
          }
          fs.readdirSync(collection).forEach(function(third) { // document

            var document = collection + '/' + third;
            if (next !== undefined) {
              next(null, document);
            }
            fs.unlinkSync(document);
          });
          if (metadata !== '') {
            fs.unlinkSync(metadata + second);
          }
          fs.rmdirSync(collection);
        });
        if (metadata !== '') {
          fs.rmdirSync(metadata);
        }
        fs.rmdirSync(database);
      });
    }
    it('should rm db directory', function(done) {

      rmDir(ROOT);
      done();
    });
  });
});
