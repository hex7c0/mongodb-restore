'use strict';
/**
 * @file simple example
 * @module mongodb-restore
 * @package mongodb-restore
 * @subpackage examples
 * @version 0.0.0
 * @author hex7c0 <hex7c0@gmail.com>
 * @license GPLv3
 */

/*
 * initialize module
 */
// import
var restore = require('..'); // use require('mongodb-restore') instead

/*
 * use
 */
restore({
  uri: 'uri', // mongodb://<dbuser>:<dbpassword>@<dbdomain>.mongolab.com:<dbport>/<dbdatabase>
  root: __dirname + '/db'
});
