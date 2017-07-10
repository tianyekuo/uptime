/**
 * Created by knight on 2016/10/12.
 */
var request = require('request');
var url='http://api.phone.com?mobile=13917760249&code=Uptime|down|api'
request(url+encodeURIComponent('fetch info'), function (error, response, body) {
    console.log(error);
    console.log(response);
    console.log(body);
  if (!error && response.statusCode == 200) {
    console.log(body);
  }
})

