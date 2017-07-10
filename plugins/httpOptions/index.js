/**
 * HTTP options plugin
 *
 * Add options to a HTTP/HTTPS poller on a per-check basis
 *
 * Installation
 * ------------
 * This plugin is enabled by default. To disable it, remove its entry 
 * from the `plugins` key of the configuration:
 *
 *   // in config/production.yaml
 *   plugins:
 *     # - ./plugins/httpOptions
 *
 * Usage
 * -----
 * Add the custom HTTP/HTTPS options in the 'HTTP Options' textarea displayed 
 * in the check Edit page, in YAML format. For instance:
 *
 * method: HEAD
 * headers:
 *   User-Agent: This Is Uptime Calling
 *   X-My-Custom-Header: FooBar
 *
 * See the Node documentation for a list of available options.
 *
 * When Uptime polls a HTTP or HTTPS check, the custom options override
 * the ClientRequest options.
 */
var fs   = require('fs');
var ejs  = require('ejs');
var yaml = require('js-yaml');
var express = require('express');

var template = fs.readFileSync(__dirname + '/views/_detailsEdit.ejs', 'utf8');

exports.initWebApp = function(options) {

  var dashboard = options.dashboard;

	dashboard.on('populateFromDirtyCheck', function(checkDocument, dirtyCheck, type) {
		if (type !== 'http' && type !== 'https') return;
        if (dirtyCheck.http_options){
            var http_options = dirtyCheck.http_options;
            try {
              var options = yaml.safeLoad(dirtyCheck.http_options);
              checkDocument.setPollerParam('http_options', options);
            } catch (e) {
              if (e instanceof YAMLException) {
                throw new Error('Malformed YAML configuration ' + dirtyCheck.http_options);
              } else throw e;
            }
        }
        // var sign1 = dirtyCheck.http_sign || '';
        checkDocument.setPollerParam('http_sign', dirtyCheck.http_sign || '');
        // var params = ;
        checkDocument.setPollerParam('http_params', dirtyCheck.http_params || '');
	});

  dashboard.on('checkEdit', function(type, check, partial) {
    if (type !== 'http' && type !== 'https') return;
    check.http_options = '';
    var options = check.getPollerParam('http_options');
    if (options) {
      try {
        options = yaml.safeDump(options);
      } catch (e) {
        if (e instanceof YAMLException) {
          throw new Error('Malformed HTTP options');
        } else throw e;
      }
      check.setPollerParam('http_options', options);
    }
    check.http_params='';
    var params=check.getPollerParam('http_params');
    if(params){
        check.setPollerParam('http_params', params);
    }
  var sign=check.getPollerParam('http_sign');
  if(sign){
      check.setPollerParam('http_sign', sign);
  }
    partial.push(ejs.render(template, { locals: { check: check } }));
  });

  options.app.use(express.static(__dirname + '/public'));

};

exports.initMonitor = function(options) {

  options.monitor.on('pollerCreated', function(poller, check, details) {
    if (check.type !== 'http' && check.type !== 'https') return;
    var options = check.pollerParams && check.pollerParams.http_options;
    if (!options) return;
    // add the custom options to the poller target
    for (var key in options) {
      poller.target[key] = options[key];
    }
    //增加http post body支持
    if(check.pollerParams.http_params){
        poller.target['http_params'] = check.pollerParams.http_params
    }
    

    return;
  });

};
