'use strict';
/**
 * @file tar example
 * @module mongodb-restore
 * @subpackage examples
 * @version 0.0.1
 * @author hex7c0 <hex7c0@gmail.com>
 * @license GPLv3
 */

/*
 * initialize module
 */
var restore = require('..'); // use require('mongodb-restore') instead

/*
 * use
 */
restore({
  uri: 'uri', // mongodb://<dbuser>:<dbpassword>@<dbdomain>.mongolab.com:<dbport>/<dbdatabase>
  root: __dirname + '/db',
  tar: 'dump.tar'
});
