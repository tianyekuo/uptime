/**
 * Created by zhangtao on 2016/4/6.
 */
var Log = require('log');
log = new Log('info');

var log4js = require('log4js');
var logger = log4js.getLogger();

var yaml = require('js-yaml');

req= new Object()
req.url ="http://192.168.1.98/api/getCommodityDetail.htm";

var check = req.body;
var Poller, p;
var now = Date.now();
var self = this;
var pollerCallback = function(err, time, res, pollerDetails) {
    if (err) {
        return self.createPing(err, check, now, time, pollerDetails || details, callback);
    }
    try {
        self.emit('pollerPolled', check, res, pollerDetails || details);
        self.createPing(null, check, now, time, pollerDetails || details, callback);
    } catch (error) {
        return self.createPing(error, check, now, time, pollerDetails || details, callback);
    }
};

Poller = this.pollerCollection.getForType(check.type || 'http');
p = new Poller(check.url, this.config.timeout, pollerCallback);

p.poll();
log.info('xxx');
console.log('abc');
logger.info('logger');

res.json('{"a":"b"}')
