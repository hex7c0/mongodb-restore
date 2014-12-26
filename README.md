# [mongodb-restore](http://supergiovane.tk/#/mongodb-restore)

[![NPM version](https://badge.fury.io/js/mongodb-restore.svg)](http://badge.fury.io/js/mongodb-restore)
[![Build Status](https://travis-ci.org/hex7c0/mongodb-restore.svg)](https://travis-ci.org/hex7c0/mongodb-restore)
[![Dependency Status](https://david-dm.org/hex7c0/mongodb-restore/status.svg)](https://david-dm.org/hex7c0/mongodb-restore)

Restore data from [`mongodb-backup`](https://github.com/hex7c0/mongodb-backup).

Look at [`mongodb-restore-cli`](https://github.com/hex7c0/mongodb-restore-cli) for command line usage, similar to [mongorestore](http://docs.mongodb.org/manual/reference/program/mongorestore/).

## Installation

Install through NPM

```bash
npm install mongodb-restore
```
or
```bash
git clone git://github.com/hex7c0/mongodb-restore.git
```

## API

inside nodejs project
```js
var restore = require('mongodb-restore');
```

### restore(options)

#### options

 - `uri` - **String** URI for MongoDb connection *(default "required")*
 - `root`- **String** Path where save data *(default "required")*
 - `[parser]` - **String** Data parser (bson, json) *(default "bson")*
 - `[callback]` - **Function** Callback *(default "disabled")*
 - `[tar]` - **String** Pack files into a .tar file *(default "disabled")*
 - `[logger]` - **String** Path where save log file *(default "disabled")*
 - `[metadata]` - **Boolean** Save metadata of collections as Index, ecc *(default "false")*

## Examples

Take a look at my [examples](https://github.com/hex7c0/mongodb-restore/tree/master/examples)

### [License GPLv3](http://opensource.org/licenses/GPL-3.0)
