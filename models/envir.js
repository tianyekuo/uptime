var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var moment   = require('moment');
var async    = require('async');

// model dependencies

// main model
var Envir = new Schema({
  name           : String,
  params         : Object,
});
Envir.index({ name: 1 }, { unique: true });
Envir.plugin(require('mongoose-lifecycle'));


Envir.methods.populateFromDirtyEnvir = function(dirtyEnvir) {
  this.name = dirtyEnvir.name || this.name;
  this.params = dirtyEnvir.params || this.params || {};
};

module.exports = mongoose.model('Envir', Envir);
