# [mongodb-restore](https://github.com/hex7c0/mongodb-restore)

[![NPM version](https://img.shields.io/npm/v/mongodb-restore.svg)](https://www.npmjs.com/package/mongodb-restore)
[![Linux Status](https://img.shields.io/travis/hex7c0/mongodb-restore.svg?label=linux)](https://travis-ci.org/hex7c0/mongodb-restore)
[![Windows Status](https://img.shields.io/appveyor/ci/hex7c0/mongodb-restore.svg?label=windows)](https://ci.appveyor.com/project/hex7c0/mongodb-restore)
[![Dependency Status](https://img.shields.io/david/hex7c0/mongodb-restore.svg)](https://david-dm.org/hex7c0/mongodb-restore)
[![Coveralls](https://img.shields.io/coveralls/hex7c0/mongodb-restore.svg)](https://coveralls.io/r/hex7c0/mongodb-restore)

Restore data from [`mongodb-backup`](https://github.com/hex7c0/mongodb-backup)

Look at [`mongodb-restore-cli`](https://github.com/hex7c0/mongodb-restore-cli) for command line usage, similar to [mongorestore](http://docs.mongodb.org/manual/reference/program/mongorestore/)

## Installation

Install through NPM

```bash
npm install mongodb-restore
```
or
```bash
git clone git://github.com/hex7c0/mongodb-restore.git
```

Bson@0.4.11 has been pulled out, so versions >= `1.3.0` and <= `1.4.1` are deprecate

## API

inside nodejs project
```js
var restore = require('mongodb-restore');

restore({
  uri: 'uri', // mongodb://<dbuser>:<dbpassword>@<dbdomain>.mongolab.com:<dbport>/<dbdatabase>
  root: __dirname + '/db'
});
```

### restore(options)

#### options

 - `uri` - **String** [URI](http://mongodb.github.io/node-mongodb-native/2.0/tutorials/urls/) for MongoDb connection *(default "required")*
 - `root`- **String** Path where get the backup *(default "required")*
 - `[parser]` - **String | Function** Data parser (bson, json) or custom *(default "bson")*
 - `[callback]` - **Function** Callback when done *(default "disabled")*
 - `[stream]`- **Object** Get `.tar` file from Node stream *(default "disabled")*
 - `[tar]` - **String** Extract files from a .tar file *(default "disabled")*
 - `[logger]` - **String** Path where save a .log file *(default "disabled")*
 - `[metadata]` - **Boolean** Set metadata of collections as Index, ecc *(default "false")*
 - `[drop]` - **Boolean** Drop every collection from the target database before restoring the collection *(default "false")*
 - `[dropCollections]` - **Boolean|Array** Drop every collection from the target database before restoring if Boolean (similar to `drop` option), or selected collections if Array *(default "false")*
 - `[options]` - **Object** MongoDb [options](http://mongodb.github.io/node-mongodb-native/2.0/tutorials/connecting/#toc_7) *(default)*

## Examples

Take a look at my [examples](examples)

### [License Apache2](LICENSE)
