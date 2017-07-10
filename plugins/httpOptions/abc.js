/**
 * Created by zhangtao on 2016/5/9.
 */
/*var yaml = require('js-yaml');
var fs = require("fs");
var doc = yaml.safeLoad(fs.readFileSync('./config/development.yaml', 'utf8'));
console.log(doc);*/
var nodemailer = require('nodemailer');

var config = require("config");
var mailer = nodemailer.createTransport(config.email.method, config.get('email.transport'));
var mailOptions = {
    from:    config.email.message.from,
    to:      config.email.message.to,
    subject: "subject",
    text:    "test body"
};
mailer.sendMail(mailOptions, function(err2, response) {
    if (err2) return console.error('Email plugin error: %s', err2);
    console.log('Notified event by email: Check ');
});
var i=0;

