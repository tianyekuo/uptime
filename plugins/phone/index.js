/**
 * Email plugin
 *
 * Notifies all events (up, down, paused, restarted) by email
 *
 * Installation
 * ------------
 * This plugin is disabled by default. To enable it, add its entry
 * to the `plugins` key of the configuration:
 *
 *   // in config/production.yaml
 *   plugins:
 *     - ./plugins/email
 *
 * Usage
 * -----
 * This plugin sends an email each time a check is started, goes down, or goes back up.
 * When the check goes down, the email contains the error details:
 *
 *   Object: [Down] Check "FooBar" just went down
 *   On Thursday, September 4th 1986 8:30 PM,
 *   a test on URL "http://foobar.com" failed with the following error:
 *
 *     Error 500
 *
 *   Uptime won't send anymore emails about this check until it goes back up.
 *   ---------------------------------------------------------------------
 *   This is an automated email sent from Uptime. Please don't reply to it.
 *
 */
var fs         = require('fs');
var moment     = require('moment');
var CheckEvent = require('../../models/checkEvent');
var ejs        = require('ejs');
var request = require('request');
var template = fs.readFileSync(__dirname + '/views/_detailsEdit.ejs', 'utf8');

exports.initWebApp = function(options) {
  var config = options.config.phone;

  var dashboard = options.dashboard;
  dashboard.on('checkEdit', function(type, check, partial) {
    partial.push(ejs.render(template, { locals: { check: check } }));

  });

  dashboard.on('populateFromDirtyCheck', function(checkDocument, dirtyCheck, type) {
    checkDocument.setPollerParam('phone', dirtyCheck.phone || '');
  });

  CheckEvent.on('afterInsert', function(checkEvent) {
    checkEvent.findCheck(function(err, check) {
      var message = check.name;
      console.log(checkEvent.message);
      switch (checkEvent.message) {
        case 'down':
          var number;
          var MIN_NUMBER = 10000000000;
          if (parseInt(config.number) > MIN_NUMBER){
            number = parseInt(config.number);
          };
          var params = check.pollerParams;
          if(params){
            var aNumber = params.phone;
            if(aNumber && parseInt(aNumber) > MIN_NUMBER){
              number =parseInt(aNumber);
            }
          }
          if(number){
            var url='http://api.phone.com?mobile=' +
                number + '&code=Uptime|down|' + encodeURIComponent(message);
            console.log(url);
            request(url, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                console.log(url);
                console.log(body);
              }
            })
          }
          break;
        default:
          break;
      }
    });
  });
  console.log('Enabled Phone notifications');
};