'use strict';
/**
 * @file mongodb-restore main
 * @module mongodb-restore
 * @subpackage main
 * @version 0.1.0
 * @author hex7c0 <hex7c0@gmail.com>
 * @copyright hex7c0 2014
 * @license GPLv3
 */

/*
 * initialize module
 */
// import
var fs = require('fs');
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

  return logger(err.message);
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
    error(new Error('missing metadata for ' + collection.collectionName));
    return next();
  }
  try {
    doc = JSON.parse(fs.readFileSync(t, {
      encoding: 'utf8'
    }));
  } catch (err) {
    error(err);
    return next();
  }
  if (doc.length === 0) {
    return next();
  }
  for (var i = 0, c = 0, ii = doc.length; i < ii; i++) {
    var indexes = doc[i];
    if (/^_id/.test(indexes.name) === true) {
      if (++c === ii) {
        next();
      }
      continue;
    }
    var name = indexes.name.substr(0, indexes.name.length - 2);
    collection.createIndex(name, indexes, function(err) {

      if (err !== null) {
        error(err);
      }
      if (++c === ii) {
        next();
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

    if (err !== null && err.code === 'ENOENT') {
      logger('make dir at ' + path);
      fs.mkdir(path, next(null, path));
    } else if (stats !== undefined && stats.isDirectory() === false) {
      logger('make dir at ' + path);
      fs.unlink(path, function() {

        fs.mkdir(path, next(error(new Error('path was a file')), path));
      });
    } else {
      next(null, path);
    }
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

/**
 * JSON parser
 * 
 * @function fromJson
 * @param {Object} collection - collection model
 * @param {String} collectionPath - path of collection
 * @param {Function} next - callback
 */
function fromJson(collection, collectionPath, next) {

  var docs = fs.readdirSync(collectionPath);
  var last = docs.length, index = 0;
  if (last < 1) {
    return next();
  }
  docs.forEach(function(docName) {

    var doc;
    var docPath = collectionPath + docName;
    if (fs.statSync(docPath).isFile() === false) {
      var err = new Error('document is not a valid format');
      return last === ++index ? next(err) : error(err);
    }
    try {
      doc = JSON.parse(fs.readFileSync(docPath, {
        encoding: 'utf8'
      }));
    } catch (err) {
      return last === ++index ? next(err) : error(err);
    }
    collection.save(doc, function(err) {

      if (err !== null) {
        return last === ++index ? next(err) : error(err);
      }
      return last === ++index ? next() : null;
    });
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

  var docs = fs.readdirSync(collectionPath);
  var last = docs.length, index = 0;
  if (last < 1) {
    return next();
  }
  docs.forEach(function(docName) {

    var doc;
    var docPath = collectionPath + docName;
    if (fs.statSync(docPath).isFile() === false) {
      var err = new Error('document is not a valid format');
      return last === ++index ? next(err) : error(err);
    }
    try {
      doc = BSON.deserialize(fs.readFileSync(docPath, {
        encoding: null
      }));
    } catch (err) {
      return last === ++index ? next(err) : error(err);
    }
    collection.save(doc, function(err) {

      if (err !== null) {
        return last === ++index ? next(err) : error(err);
      }
      return last === ++index ? next() : null;
    });
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
  var last = collections.length, index = 0;
  if (last < 1) {
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

      if (err !== null) {
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
        BSON = require('bson').BSONPure.BSON;
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

  function callback() {

    logger('restore stop');
    if (my.tar !== null) {
      rmDir(my.dir);
    }
    if (my.callback !== null) {
      logger('callback run');
      my.callback();
    }
  }

  var go = function(root) {

    if (my.metadata === true) {
      metadata = root + '.metadata/';
    }
    require('mongodb').MongoClient.connect(my.uri, my.options,
      function(err, db) {

        logger('db open');
        if (err !== null) {
          return error(err);
        }
        // waiting for `db.fsyncLock()` on node driver
        discriminator(db, root, metadata, parser, function(err) {

          if (err !== null) {
            error(err);
          }
          logger('db close');
          db.close();
          callback();
        });
      });
  };
  if (my.tar === null) {
    go(my.root);
  } else {
    logger('open tar file at ' + my.root + my.tar);
    makeDir(my.dir, function() {

      var extractor = require('tar').Extract({
        path: my.dir
      }).on('error', error).on('end', function() {

        var dirs = fs.readdirSync(my.dir);
        for (var i = 0, ii = dirs.length; i < ii; i++) {
          var t = my.dir + dirs[i];
          if (fs.statSync(t).isFile() === false) {
            return go(t + '/');
          }
        }
      });
      fs.createReadStream(my.root + my.tar).on('error', error).pipe(extractor);
    });
  }
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
  } else if (!opt.root) {
    throw new Error('missing root option');
  } else if (!fs.existsSync(opt.root) || !fs.statSync(opt.root).isDirectory()) {
    throw new Error('root option is not a directory');
  }

  var my = {
    dir: __dirname + '/dump/',
    uri: String(opt.uri),
    root: resolve(String(opt.root)) + '/',
    parser: opt.parser || 'bson',
    callback: typeof (opt.callback) == 'function' ? opt.callback : null,
    tar: typeof opt.tar === 'string' ? opt.tar : null,
    logger: typeof opt.logger === 'string' ? resolve(opt.logger) : null,
    metadata: Boolean(opt.metadata),
    options: typeof opt.options === 'object' ? opt.options : {}
  };
  return wrapper(my);
}
module.exports = restore;
