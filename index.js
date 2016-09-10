'use strict';
/**
 * @file mongodb-restore main
 * @module mongodb-restore
 * @subpackage main
 * @version 1.3.0
 * @author hex7c0 <hex7c0@gmail.com>
 * @copyright hex7c0 2014
 * @license GPLv3
 */

/*
 * initialize module
 */
var systemRegex = /^system\./;
var fs = require('graceful-fs');
var BSON;
var logger;
var meta;

/*
 * functions
 */
/**
 * error handler
 * 
 * @function error
 * @param {Object} err - raised error
 */
function error(err) {

  logger(err.message);
}

/**
 * read collection metadata from file
 * 
 * @function readMetadata
 * @param {Object} collection - db collection
 * @param {String} metadata - path of metadata
 * @param {Function} next - callback
 */
function readMetadata(collection, metadata, next) {

  var doc;
  var t = metadata + collection.collectionName;
  if (fs.existsSync(t) === false) {
    return next(new Error('missing metadata for ' + collection.collectionName));
  }
  try {
    doc = JSON.parse(fs.readFileSync(t));
  } catch (err) {
    return next(err);
  }
  if (doc.length === 0) {
    return next(null);
  }
  for (var i = 0, c = 0, ii = doc.length; i < ii; ++i) {
    var indexes = doc[i];
    if (/^_id/.test(indexes.name) === true) {
      if (++c === ii) {
        next(null);
      }
      continue;
    }
    var name = indexes.name.substr(0, indexes.name.length - 2);
    collection.createIndex(name, indexes, function(err) {

      if (err) {
        next(err);
      } else if (++c === ii) {
        next(null);
      }
    });
  }
}

/**
 * make dir
 * 
 * @function makeDir
 * @param {String} path - path of dir
 * @param {Function} next - callback
 */
function makeDir(path, next) {

  fs.stat(path, function(err, stats) {

    if (err && err.code === 'ENOENT') {
      logger('make dir at ' + path);
      return fs.mkdir(path, function(err) {

        next(err, path);
      });

    } else if (stats && stats.isDirectory() === false) {
      logger('unlink file at ' + path);
      return fs.unlink(path, function() {

        logger('make dir at ' + path);
        fs.mkdir(path, function(err) {

          next(err, path);
        });
      });
    }

    next(null, path);
  });
}

/**
 * remove dir
 * 
 * @function rmDir
 * @param {String} path - path of dir
 * @param {Function} [next] - callback
 */
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
        fs.unlinkSync(document);
        return next ? next(null, document) : '';
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

/**
 * JSON parser
 * 
 * @function fromJson
 * @param {Object} collection - collection model
 * @param {String} collectionPath - path of collection
 * @param {Function} next - callback
 */
function fromJson(collection, collectionPath, next) {

  var docsBulk = [];
  var docs = fs.readdirSync(collectionPath);
  var last = docs.length, index = 0;
  if (last < 1) {
    return next(null);
  }

  docs.forEach(function(docName) {

    var doc;
    var docPath = collectionPath + docName;
    if (fs.statSync(docPath).isFile() === false) { // dir
      return last === ++index ? next(null) : error(null);
    }
    try {
      doc = JSON.parse(fs.readFileSync(docPath));
    } catch (err) {
      return last === ++index ? next(err) : error(err);
    }

    docsBulk.push({
      insertOne: {
        document: doc
      }
    });
    return last === ++index ? collection.bulkWrite(docsBulk, next) : null;
  });
}

/**
 * BSON parser
 * 
 * @function fromBson
 * @param {Object} collection - collection model
 * @param {String} collectionPath - path of collection
 * @param {Function} next - callback
 */
function fromBson(collection, collectionPath, next) {

  var docsBulk = [];
  var docs = fs.readdirSync(collectionPath);
  var last = docs.length, index = 0;
  if (last < 1) {
    return next(null);
  }

  docs.forEach(function(docName) {

    var doc;
    var docPath = collectionPath + docName;
    if (fs.statSync(docPath).isFile() === false) { // dir
      return last === ++index ? next(null) : error(null);
    }
    try {
      doc = BSON.deserialize(fs.readFileSync(docPath));
    } catch (err) {
      return last === ++index ? next(err) : error(err);
    }

    docsBulk.push({
      insertOne: {
        document: doc
      }
    });
    return last === ++index ? collection.bulkWrite(docsBulk, next) : null;
  });
}

/**
 * set data to all collections available
 * 
 * @function allCollections
 * @param {Object} db - database
 * @param {String} name - path of database
 * @param {String} metadata - path of metadata
 * @param {Function} parser - data parser
 * @param {Function} next - callback
 */
function allCollections(db, name, metadata, parser, next) {

  var collections = fs.readdirSync(name);
  var last = ~~collections.length, index = 0;
  if (last === 0) { // empty set
    return next(null);
  }

  if (collections.indexOf('.metadata') >= 0) { // undefined is not a dir
    delete collections[collections.indexOf('.metadata')];
    last--;
  }

  collections.forEach(function(collectionName) {

    var collectionPath = name + collectionName;
    if (!fs.statSync(collectionPath).isDirectory()) {
      var err = new Error(collectionPath + ' is not a directory');
      return last === ++index ? next(err) : error(err);
    }
    db.createCollection(collectionName, function(err, collection) {

      if (err) {
        return last === ++index ? next(err) : error(err);
      }
      logger('select collection ' + collectionName);
      meta(collection, metadata, function() {

        parser(collection, collectionPath + '/', function(err) {

          if (err) {
            return last === ++index ? next(err) : error(err);
          }
          return last === ++index ? next(null) : null;
        });
      });
    });
  });
}

/**
 * drop data from some collections
 * 
 * @function someCollections
 * @param {Object} db - database
 * @param {Array} collections - selected collections
 * @param {Function} next - callback
 */
function someCollections(db, collections, next) {

  var last = ~~collections.length, index = 0;
  if (last === 0) { // empty set
    return next(null);
  }

  collections.forEach(function(collection) {

    db.collection(collection, function(err, collection) {

      logger('select collection ' + collection.collectionName);
      if (err) {
        return last === ++index ? next(err) : error(err);
      }
      collection.drop(function(err) {

        if (err) {
          return last === ++index ? next(err) : error(err);
        }
        return last === ++index ? next(null) : null;
      });
    });
  });
}

/**
 * function wrapper
 * 
 * @function wrapper
 * @param {Object} my - parsed options
 */
function wrapper(my) {

  var parser;
  if (typeof my.parser === 'function') {
    parser = my.parser;
  } else {
    switch (my.parser) {
      case 'bson':
        BSON = require('bson');
        BSON = new BSON.BSONPure.BSON();
        parser = fromBson;
        break;
      case 'json':
        // JSON error on ObjectId and Date
        parser = fromJson;
        break;
      default:
        throw new Error('missing parser option');
    }
  }

  var discriminator = allCollections;

  if (my.logger === null) {
    logger = function() {

      return;
    };
  } else {
    logger = require('logger-request')({
      filename: my.logger,
      standalone: true,
      daily: true,
      winston: {
        logger: '_mongo_r' + my.logger,
        level: 'info',
        json: false
      }
    });
    logger('restore start');
    var log = require('mongodb').Logger;
    log.setLevel('info');
    log.setCurrentLogger(function(msg) {

      logger(msg);
    });
  }

  var metadata = '';
  if (my.metadata === true) {
    meta = readMetadata;
  } else {
    meta = function(a, b, c) {

      return c();
    };
  }

  /**
   * latest callback
   * 
   * @return {Null}
   */
  function callback(err) {

    logger('restore stop');
    if (my.tar) {
      rmDir(my.dir);
    }

    if (my.callback !== null) {
      logger('callback run');
      my.callback(err);

    } else if (err) {
      logger(err);
    }
  }

  /**
   * entry point
   * 
   * @return {Null}
   */
  function go(root) {

    if (my.metadata === true) {
      metadata = root + '.metadata/';
    }
    require('mongodb').MongoClient.connect(my.uri, my.options,
      function(err, db) {

        logger('db open');
        if (err) {
          return callback(err);
        }

        function next(err) {

          if (err) {
            logger('db close');
            db.close();
            return callback(err);
          }

          // waiting for `db.fsyncLock()` on node driver
          discriminator(db, root, metadata, parser, function(err) {

            logger('db close');
            db.close();
            callback(err);
          });
        }

        if (my.drop === true) {
          logger('drop database');
          return db.dropDatabase(next);

        } else if (my.dropCollections) {
          logger('drop collections');
          if (Array.isArray(my.dropCollections) === true) {
            return someCollections(db, my.dropCollections, next);
          }
          return db.collections(function(err, collections) {

            if (err) {
              error(err);
            }
            my.dropCollections = [];
            for (var i = 0, ii = collections.length; i < ii; i++) {
              var collectionName = collections[i].collectionName;
              if (systemRegex.test(collectionName) === false) {
                my.dropCollections.push(collectionName);
              }
            }
            someCollections(db, my.dropCollections, next);
          });
        }

        next(null);
      });
  }

  if (!my.tar) {
    return go(my.root);
  }

  makeDir(my.dir, function() {

    var extractor = require('tar').Extract({
      path: my.dir
    }).on('error', callback).on('end', function() {

      var dirs = fs.readdirSync(my.dir);
      for (var i = 0, ii = dirs.length; i < ii; i++) {
        var t = my.dir + dirs[i];
        if (fs.statSync(t).isFile() === false) {
          return go(t + '/');
        }
      }
    });

    if (my.stream !== null) { // user stream
      logger('get tar file from stream');
      my.stream.pipe(extractor);

    } else { // filesystem stream
      logger('open tar file at ' + my.root + my.tar);
      fs.createReadStream(my.root + my.tar).on('error', callback).pipe(
        extractor);
    }
  });
}

/**
 * option setting
 * 
 * @exports restore
 * @function restore
 * @param {Object} options - various options. Check README.md
 */
function restore(options) {

  var resolve = require('path').resolve;

  var opt = options || Object.create(null);
  if (!opt.uri) {
    throw new Error('missing uri option');
  }
  if (!opt.stream) {
    if (!opt.root) {
      throw new Error('missing root option');
    } else if (!fs.existsSync(opt.root) || !fs.statSync(opt.root).isDirectory()) {
      throw new Error('root option is not a directory');
    }
  }

  var my = {
    dir: __dirname + '/dump/',
    uri: String(opt.uri),
    root: resolve(String(opt.root)) + '/',
    stream: opt.stream || null,
    parser: opt.parser || 'bson',
    callback: typeof opt.callback === 'function' ? opt.callback : null,
    tar: typeof opt.tar === 'string' ? opt.tar : null,
    logger: typeof opt.logger === 'string' ? resolve(opt.logger) : null,
    metadata: Boolean(opt.metadata),
    drop: Boolean(opt.drop),
    dropCollections: Boolean(opt.dropCollections) ? opt.dropCollections : null,
    options: typeof opt.options === 'object' ? opt.options : {}
  };
  if (my.stream) {
    my.tar = true; // override
  }
  wrapper(my);
}
module.exports = restore;
