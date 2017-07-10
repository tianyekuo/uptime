/**
 * Module dependencies.
 */
var express = require('express');
var async = require('async');
var partials = require('express-partials');
var flash = require('connect-flash');
var moment = require('moment');

var Check = require('../../models/check');
var Tag = require('../../models/tag');
var Envir = require('../../models/envir');
var TagDailyStat = require('../../models/tagDailyStat');
var TagMonthlyStat = require('../../models/tagMonthlyStat');
var CheckMonthlyStat = require('../../models/checkMonthlyStat');
var moduleInfo = require('../../package.json');

var app = module.exports = express();

// middleware

app.configure(function(){
  app.use(partials());
  app.use(flash());
  app.use(function locals(req, res, next) {
    res.locals.route = app.route;
    res.locals.addedCss = [];
    res.locals.renderCssTags = function (all) {
      if (all != undefined) {
        return all.map(function(css) {
          return '<link rel="stylesheet" href="' + app.route + '/stylesheets/' + css + '">';
        }).join('\n ');
      } else {
        return '';
      }
    };
    res.locals.moment = moment;
    next();
  });
  app.use(app.router);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.locals({
  version: moduleInfo.version
});

// Routes

app.get('/events', function(req, res) {
  res.render('events');
});

app.get('/checks', function(req, res, next) {
  Check.find().sort({ isUp: 1, lastChanged: -1 }).exec(function(err, checks) {
    if (err) return next(err);
    res.render('checks', { info: req.flash('info'), checks: checks });
  });
});

app.get('/checks/new', function(req, res) {
  // res.render('check_new', { check: new Check(), pollerCollection: app.get('pollerCollection'),pollerDetails:"", info: req.flash('info') });
  Envir.find().sort({ name: 1 }).exec(function(err, envirs) {
    if (err) return next(err);
    res.render('check_new', { 
      check: new Check(), 
      envirs: envirs, 
      pollerCollection: app.get('pollerCollection'), 
      pollerDetails: "", 
      info: req.flash('info'), 
    });
  });
});

app.get('/checks/:id/clone', function(req, res, next) {
  Check.findOne({ _id: req.params.id }, function(err, check) {
    if (err) return next(err);
    if (!check) return res.send(404, 'failed to load check ' + req.params.id);
    var pollerDetails = [];
    // _checkDetails.ejs depends on this value to set post/put method, form post url etc. 
    check.isNew= true;
    // app.emit('checkEdit', check.type, check, pollerDetails);
    // res.render('check_new', { check: check, pollerCollection: app.get('pollerCollection'), pollerDetails: pollerDetails.join(''), info: req.flash('info'), req: req });
    Envir.find().sort({ name: 1 }).exec(function(err, envirs) {
      if (err) return next(err);
      app.emit('checkEdit', check.type, check, pollerDetails);
      res.render('check_new', { 
        check: check, 
        envirs: envirs, 
        pollerCollection: app.get('pollerCollection'), 
        pollerDetails: pollerDetails.join(''), 
        info: req.flash('info'), 
        req: req
      });
    });
  });
  // res.render('check_new', { check: new Check(), pollerCollection: app.get('pollerCollection'), info: req.flash('info') });
});

app.post('/checks', function(req, res, next) {
  var check = new Check();
  try {
    var dirtyCheck = req.body.check;
    check.populateFromDirtyCheck(dirtyCheck, app.get('pollerCollection'))
    app.emit('populateFromDirtyCheck', check, dirtyCheck, check.type);
  } catch (err) {
    return next(err);
  }
  check.save(function(err) {
    if (err) return next(err);
    req.flash('info', 'New check has been created');
    res.redirect(app.route + (req.body.saveandadd ? '/checks/new' : ('/checks/' + check._id + '?type=hour&date=' + Date.now())));
  });
});

app.get('/checks/:id', function(req, res, next) {
  Check.findOne({ _id: req.params.id }, function(err, check) {
    if (err) return next(err);
    if (!check) return res.send(404, 'failed to load check ' + req.params.id);
      console.log(JSON.stringify(req.params));
    res.render('check', { check: check, info: req.flash('info'), req: req });
  });
});

app.get('/checks/:id/edit', function(req, res, next) {
  Check.findOne({ _id: req.params.id }, function(err, check) {
    if (err) return next(err);
    if (!check) return res.send(404, 'failed to load check ' + req.params.id);
    var pollerDetails = [];
    Envir.find().sort({ name: 1 }).exec(function(err, envirs) {
      if (err) return next(err);
      app.emit('checkEdit', check.type, check, pollerDetails);
      res.render('check_edit', { 
        check: check, 
        envirs: envirs, 
        pollerCollection: app.get('pollerCollection'), 
        pollerDetails: pollerDetails.join(''), 
        info: req.flash('info'), 
        req: req,
      });
    });
    
  });
});

app.get('/pollerPartial/:type', function(req, res, next) {
  var poller;
  try {
    poller = app.get('pollerCollection').getForType(req.params.type);
  } catch (err) {
    return next(err);
  }
  var pollerDetails = [];
  app.emit('checkEdit', req.params.type, new Check(), pollerDetails);
  res.send(pollerDetails.join(''));
});

app.get('/verifyPartial2/:type', function(req, res, next) {
  console.log("in controller ");
  console.log(req.params.type);
  res.send("OK")
});


app.get('/verifyPartial/:type', function(req, res, next) {
  console.log("in controller ");
  var verifyDetails = [];
  app.emit('verifyEdit', req.params.type, new Check(), verifyDetails);
  res.send(verifyDetails.join(''));
});

app.put('/checks/:id', function(req, res, next) {
  Check.findById(req.params.id, function(err, check) {
    if (err) return next(err);
    try {
      var dirtyCheck = req.body.check;
      check.populateFromDirtyCheck(dirtyCheck, app.get('pollerCollection'))
      app.emit('populateFromDirtyCheck', check, dirtyCheck, check.type);
    } catch (populationError) {
      return next(populationError);
    }
    check.save(function(err2) {
      if (err2) return next(err2);
      req.flash('info', 'Changes have been saved');
      res.redirect(app.route + '/checks/' + req.params.id);
    });
  });
});

app.delete('/checks/:id', function(req, res, next) {
  Check.findOne({ _id: req.params.id }, function(err, check) {
    if (err) return next(err);
    if (!check) return next(new Error('failed to load check ' + req.params.id));
    check.remove(function(err2) {
      if (err2) return next(err2);
      req.flash('info', 'Check has been deleted');
      res.redirect(app.route + '/checks');
    });
  });
});

app.get('/tags', function(req, res, next) {
  Tag.find().sort({ name: 1 }).exec(function(err, tags) {
    if (err) return next(err);
    res.render('tags', { tags: tags });
  });
});

app.get('/tags/:name', function(req, res, next) {
  Tag.findOne({ name: req.params.name }, function(err, tag) {
    if (err) {
      return next(err);
    }
    if (!tag) return next(new Error('failed to load tag ' + req.params.name));
    res.render('tag', { tag: tag, req: req });
  });
});

if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}


app.get('/verify/sample', function(req, res, next) {
  var pollerDetails = [];
  app.emit('verifySample', pollerDetails);
  // res.render('layout',{body:""})
  res.render("sample",{"body":pollerDetails});
  // res.send(pollerDetails.join(''));

  // res.send("<h1>hello</h1>h1>");

  // console.log("in controller ");
  // var verifyDetails = [];
  // app.emit('verifyEdit', req.params.type, new Check(), verifyDetails);
  // res.send(verifyDetails.join(''));
});

app.get('/options/sample', function(req, res, next) {
  // var pollerDetails = [];
  // app.emit('verifySample', pollerDetails);
  res.render("optionsSample");
});

app.get('/envirs', function(req, res, next) {
  Envir.find().sort({ name: 1 }).exec(function(err, envirs) {
    if (err) return next(err);
    res.render('envirs', { envirs: envirs });
  });
});

app.get('/envir', function(req, res, next) {
  res.render('envir_edit', { envirs: {}, req: req });
});

app.get('/envir/:id', function(req, res, next) {
  Envir.findOne({ _id: req.params.id }, function(err, envir) {
    if (err) {
      return next(err);
    }
    if (!envir) return next(new Error('failed to load envir ' + req.params.id));
    res.render('envir_edit', { envirs: envir, req: req });
  });
});