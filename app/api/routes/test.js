/**
 * Created by zhangtao on 2016/4/6.
 */
var Log = require('log');
log = new Log('info');

var log4js = require('log4js');
var logger = log4js.getLogger();
var Sign = require('../../../lib/pollers/http/httpSign');
var verify  = require('../../../plugins/resultVerify');

module.exports = function(app){
    var yaml = require('js-yaml');
    var PollerCollection = require('../../../lib/pollers/pollerCollection');
    this.pollerCollection = new PollerCollection();
    app.post('/test', function(req, res, next) {
        var check = req.body;
        var options = yaml.safeLoad(check.http_options);
        var Poller, p;
        var self = res;
        var reqCheck = req.body;

        var pollerCallback = function(err, time, res) {
            if (err) {
                self.json(JSON.stringify(err));
                return;
            }
            try {
                // console.log(res.body);
                var data = Object();
                data.body = res.body;

                try{
                    console.log(reqCheck.pollerParams.verify);
                    verify.doVerify(reqCheck, res.body);
                } catch(err){
                    console.log("Do test check fail");
                    data.err = err.message;
                    console.log(err.message);
                }
                self.json(data);
                console.log(data);
            } catch (err) {
                console.log(err);
            }
        };

        Poller = this.pollerCollection.getForType(check.type || 'http');
        var url = check.url;

        if(check.http_sign){
            url = Sign.preprocessUrl(url, check.http_sign);
        }
        p = new Poller(url, 10000, pollerCallback);
        for (var key in options) {
            p.target[key] = options[key];
        }
        if(check.http_params){
            p.target['http_params'] = check.http_params
        }
        // if(check.http_sign){
        //     p.target['http_sign'] = check.http_sign
        // }
        p.target['http_sign']="bdata"
        
        p.poll();
    });

    app.get('/test', function(req, res, next) {
        res.json('{"type":"get"}')
    });
};
