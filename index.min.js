"use strict";

function error(err) {
    err && logger(err.message);
}

function readMetadata(collection, metadata, next) {
    var doc, data;
    try {
        data = fs.readFileSync(metadata + collection.collectionName);
    } catch (err) {
        return next(null);
    }
    try {
        doc = JSON.parse(data);
    } catch (err) {
        return next(err);
    }
    var last = ~~doc.length, counter = 0;
    if (0 === last) return next(null);
    doc.forEach(function(index) {
        collection.createIndex(index.key, index, function(err) {
            return err ? last === ++counter ? next(err) : error(err) : last === ++counter ? next(null) : null;
        });
    });
}

function makeDir(pathname, next) {
    fs.stat(pathname, function(err, stats) {
        return err && "ENOENT" === err.code ? (logger("make dir at " + pathname), fs.mkdir(pathname, function(err) {
            next(err, pathname);
        })) : stats && !1 === stats.isDirectory() ? (logger("unlink file at " + pathname), 
        fs.unlink(pathname, function() {
            logger("make dir at " + pathname), fs.mkdir(pathname, function(err) {
                next(err, pathname);
            });
        })) : void next(null, pathname);
    });
}

function rmDir(pathname, next) {
    fs.readdirSync(pathname).forEach(function(first) {
        var database = pathname + first;
        if (!1 !== fs.statSync(database).isDirectory()) {
            var metadata = "", collections = fs.readdirSync(database), metadataPath = path.join(database, ".metadata");
            !0 === fs.existsSync(metadataPath) && (metadata = metadataPath + path.sep, delete collections[collections.indexOf(".metadata")]), 
            collections.forEach(function(second) {
                var collection = path.join(database, second);
                !1 !== fs.statSync(collection).isDirectory() && (fs.readdirSync(collection).forEach(function(third) {
                    var document = path.join(collection, third);
                    return fs.unlinkSync(document), next ? next(null, document) : "";
                }), "" !== metadata && fs.unlinkSync(metadata + second), fs.rmdirSync(collection));
            }), "" !== metadata && fs.rmdirSync(metadata), fs.rmdirSync(database);
        }
    });
}

function fromJson(collection, collectionPath, next) {
    var docsBulk = [], docs = fs.readdirSync(collectionPath), last = ~~docs.length, counter = 0;
    if (0 === last) return next(null);
    docs.forEach(function(docName) {
        var doc, data;
        try {
            data = fs.readFileSync(collectionPath + docName);
        } catch (err) {
            return last === ++counter ? next(null) : null;
        }
        try {
            doc = JSON.parse(data);
        } catch (err) {
            return last === ++counter ? next(err) : error(err);
        }
        return docsBulk.push({
            insertOne: {
                document: doc
            }
        }), last === ++counter ? collection.bulkWrite(docsBulk, next) : null;
    });
}

function fromBson(collection, collectionPath, next) {
    var docsBulk = [], docs = fs.readdirSync(collectionPath), last = ~~docs.length, counter = 0;
    if (0 === last) return next(null);
    docs.forEach(function(docName) {
        var doc, data;
        try {
            data = fs.readFileSync(collectionPath + docName);
        } catch (err) {
            return last === ++counter ? next(null) : null;
        }
        try {
            doc = BSON.deserialize(data);
        } catch (err) {
            return last === ++counter ? next(err) : error(err);
        }
        return docsBulk.push({
            insertOne: {
                document: doc
            }
        }), last === ++counter ? collection.bulkWrite(docsBulk, next) : null;
    });
}

function allCollections(db, name, metadata, parser, next) {
    var collections = fs.readdirSync(name), last = ~~collections.length, counter = 0;
    if (0 === last) return next(null);
    collections.indexOf(".metadata") >= 0 && (delete collections[collections.indexOf(".metadata")], 
    last--), collections.forEach(function(collectionName) {
        var collectionPath = name + collectionName;
        if (!fs.statSync(collectionPath).isDirectory()) {
            var err = new Error(collectionPath + " is not a directory");
            return last === ++counter ? next(err) : error(err);
        }
        db.createCollection(collectionName, function(err, collection) {
            if (err) return last === ++counter ? next(err) : error(err);
            logger("select collection " + collectionName), meta(collection, metadata, function(err) {
                err && error(err), parser(collection, collectionPath + path.sep, function(err) {
                    return err ? last === ++counter ? next(err) : error(err) : last === ++counter ? next(null) : null;
                });
            });
        });
    });
}

function someCollections(db, collections, next) {
    var last = ~~collections.length, counter = 0;
    if (0 === last) return next(null);
    collections.forEach(function(collection) {
        db.collection(collection, function(err, collection) {
            if (logger("select collection " + collection.collectionName), err) return last === ++counter ? next(err) : error(err);
            collection.drop(function(err) {
                return err && error(err), last === ++counter ? next(null) : null;
            });
        });
    });
}

function wrapper(my) {
    function callback(err) {
        logger("restore stop"), my.tar && rmDir(my.dir), null !== my.callback ? (logger("callback run"), 
        my.callback(err)) : err && logger(err);
    }
    function go(root) {
        !0 === my.metadata && (metadata = path.join(root, ".metadata", path.sep)), require("mongodb").MongoClient.connect(my.uri, my.options, function(err, db) {
            function next(err) {
                if (err) return logger("db close"), db.close(), callback(err);
                discriminator(db, root, metadata, parser, function(err) {
                    logger("db close"), db.close(), callback(err);
                });
            }
            return logger("db open"), err ? callback(err) : !0 === my.drop ? (logger("drop database"), 
            db.dropDatabase(next)) : my.dropCollections ? (logger("drop collections"), !0 === Array.isArray(my.dropCollections) ? someCollections(db, my.dropCollections, next) : db.collections(function(err, collections) {
                err && error(err), my.dropCollections = [];
                for (var i = 0, ii = collections.length; i < ii; ++i) {
                    var collectionName = collections[i].collectionName;
                    !1 === systemRegex.test(collectionName) && my.dropCollections.push(collectionName);
                }
                someCollections(db, my.dropCollections, next);
            })) : void next(null);
        });
    }
    var parser;
    if ("function" == typeof my.parser) parser = my.parser; else switch (my.parser.toLowerCase()) {
      case "bson":
        BSON = require("bson"), BSON = new BSON(), parser = fromBson;
        break;

      case "json":
        parser = fromJson;
        break;

      default:
        throw new Error("missing parser option");
    }
    var discriminator = allCollections;
    if (null === my.logger) logger = function() {}; else {
        (logger = require("logger-request")({
            filename: my.logger,
            standalone: !0,
            daily: !0,
            winston: {
                logger: "_mongo_r" + my.logger,
                level: "info",
                json: !1
            }
        }))("restore start");
        var log = require("mongodb").Logger;
        log.setLevel("info"), log.setCurrentLogger(function(msg) {
            logger(msg);
        });
    }
    var metadata = "";
    if (meta = !0 === my.metadata ? readMetadata : function(a, b, c) {
        return c();
    }, !my.tar) return go(my.root);
    makeDir(my.dir, function() {
        var extractor = require("tar").Extract({
            path: my.dir
        }).on("error", callback).on("end", function() {
            for (var dirs = fs.readdirSync(my.dir), i = 0, ii = dirs.length; i < ii; ++i) {
                var t = my.dir + dirs[i];
                if (!1 === fs.statSync(t).isFile()) return go(t + path.sep);
            }
        });
        null !== my.stream ? (logger("get tar file from stream"), my.stream.pipe(extractor)) : (logger("open tar file at " + my.root + my.tar), 
        fs.createReadStream(my.root + my.tar).on("error", callback).pipe(extractor));
    });
}

function restore(options) {
    var opt = options || Object.create(null);
    if (!opt.uri) throw new Error("missing uri option");
    if (!opt.stream) {
        if (!opt.root) throw new Error("missing root option");
        if (!fs.existsSync(opt.root) || !fs.statSync(opt.root).isDirectory()) throw new Error("root option is not a directory");
    }
    var my = {
        dir: path.join(__dirname, "dump", path.sep),
        uri: String(opt.uri),
        root: path.resolve(String(opt.root)) + path.sep,
        stream: opt.stream || null,
        parser: opt.parser || "bson",
        callback: "function" == typeof opt.callback ? opt.callback : null,
        tar: "string" == typeof opt.tar ? opt.tar : null,
        logger: "string" == typeof opt.logger ? path.resolve(opt.logger) : null,
        metadata: Boolean(opt.metadata),
        drop: Boolean(opt.drop),
        dropCollections: Boolean(opt.dropCollections) ? opt.dropCollections : null,
        options: "object" == typeof opt.options ? opt.options : {}
    };
    my.stream && (my.tar = !0), wrapper(my);
}

var systemRegex = /^system\./, fs = require("graceful-fs"), path = require("path"), BSON, logger, meta;

module.exports = restore;
