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
  root: __dirname, // read tar file from this dir
  tar: 'dump.tar' // restore backup from this tar file
});
