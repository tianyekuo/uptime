/**
 * Module dependencies.
 */

var Envir           = require('../../../models/envir');

/**
 * Envir Routes
 */
module.exports = function(app) {
  
  app.get('/envir', function(req, res) {
    Envir
    .find()
    .sort({})
    .exec(function(err, envir) {
      if (err) return next(err);
      res.json(envir);
    });
  });

  // envir route middleware
  var loadTag = function(req, res, next) {
    Envir.findOne({ _id: req.params.id }, function(err, envir) {
      if (err) return next(err);
      if (!envir) return res.json(404, { error: 'failed to load envir ' + req.params.name });
      req.envir = envir;
      next();
    });
  };
  
  app.get('/envir/:id', loadTag, function(req, res, next) {
    res.json(req.envir);
  });

  app.put('/envir', function(req, res, next) {
    var envir = new Envir();
    try {
     envir.populateFromDirtyEnvir(req.body);
     app.emit('populateFromDirtyEnvir', envir, req.body, envir.type);
    } catch (checkException) {
     return next(checkException);
    }
    envir.save(function(saveError) {
     if(saveError) return next({status:500, error: saveError});
     res.json(envir);
    });
  });

  app.post('/envir', function(req, res, next) {
    var envir = new Envir();
    try {
      envir.populateFromDirtyEnvir(req.body);
    } catch (checkException) {
      return next(checkException);
    }
    envir.save(function(saveError) {
      if(saveError) return next({status:500, error: saveError});
      res.json(envir);
    });
  });

  app.post('/envir/:id', function(req, res, next) {
    Envir.findOne({ _id: req.params.id }, function(err, envir) {
      if (err) return next({status:500, error: err});
      if (!envir) return next({status:404, error: 'failed to load envir ' + req.params.id})

      try {
        envir.populateFromDirtyEnvir(req.body);
      } catch (checkException) {
        return next(checkException);
      }
      envir.save(function(saveError) {
        if(saveError) return next({status:500, error: saveError});
        res.json(envir);
      });
    });
  });


};
