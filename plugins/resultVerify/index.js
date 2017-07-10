/**
 *
 * Created by zhangtao on 2016/4/6.
 * Result verify plugin
 *
 * Adds the ability to HTTP & HTTPS pollers to test the response body against several type assert
 *
 * Installation
 * ------------
 * This plugin is enabled by default. To disable it, remove its entry 
 * from the `plugins` key of the configuration:
 *
 *   // in config/production.yaml
 *   plugins:
 *     # - ./plugins/resultVerify
 *
 * Usage
 * -----
 * Add a pattern to http checks in the dashboard UI.
 * type: exist.   param1 {'code':0}.
 * type count param1:data param2 3.  the data json element have 3 children
 *
 * When Uptime polls a check with a pattern, it tests the pattern against the 
 * response body. If the pattern is not found, the check is considered failed.
 */
var fs   = require('fs');
var ejs  = require('ejs');

var template = fs.readFileSync(__dirname + '/views/_verifyEdit.ejs', 'utf8');
var template2 = fs.readFileSync(__dirname + '/views/_verifyEdit2.ejs', 'utf8');

var fs = require("fs");
var jquery = fs.readFileSync(__dirname+ "/jquery.js", "utf-8");
var jsdom = require("jsdom");
var domain = require('domain');
var cheerio = require('cheerio');


exports.initWebApp = function(options) {
  var dashboard = options.dashboard;
    dashboard.on('populateFromDirtyCheck', function(checkDocument, dirtyCheck, type) {
        if (type !== 'http' && type !== 'https') return;
        if(typeof(dirtyCheck.verify)==='object'){
            var verify = dirtyCheck.verify;
            // console.log(verify);
            var result=[]
            if (verify.type instanceof  Array){
                verify.type.forEach(function(item,  index){
                    if(verify.param1[index] !== "" || verify.param2[index] !== ""){
                      result.push({"type":verify.type[index],"param1":verify.param1[index],"param2":verify.param2[index]});
                    };
                });
            }
            else{
                //后续提供删除按钮，目前只有两个都为空才删除
                if(verify.param1 !== "" || verify.param2 !== ""){
                    result.push({"type":verify.type,"param1":verify.param1,"param2":verify.param2});
                };
            }
            
            checkDocument.setPollerParam('verify', result);
        }
    });
    dashboard.on('verifySample', function(details) {
        var verify = {
            "verify": [
                {
                    "param2": "0",
                    "param1": "meta.errno",
                    "type": "equal"
                },
                {
                    "param2": "2",
                    "param1": "result.data.commodityList",
                    "type": "count"
                },
                {
                    "param2": "1161",
                    "param1": "result.data.commodityList[0].bullId",
                    "type": "equal"
                },
                {
                    "param2": "<=2",
                    "param1": "result.data.commodityList",
                    "type": "count"
                },
                {
                    "param2": ">1000",
                    "param1": "",
                    "type": "length"
                },
                {
                    "param1": "result.data.commodityList[0].activityType",
                    "type": "exist"
                }


            ]
        };
        details.push(ejs.render(template2, verify ));

    });

  dashboard.on('checkEdit', function(type, check, partial) {
    if (type !== 'http' && type !== 'https') return;
      partial.push(ejs.render(template, { locals: { check: check } }));

      if(check.pollerParams !==undefined  && check.pollerParams.verify !== undefined){
          partial.push(ejs.render(template2, {verify:check.pollerParams.verify} ));
      }
  });
    
    dashboard.on('verifyEdit', function(type, check, partial) {
        // if (type !== 'count' && type !== 'exist') return;
        var obj = {verify: [{"type": type}]};
        partial.push(ejs.render(template2, obj ));
    });
};

function getData(data, item, responseType){
    try{
        if(responseType =='json'){
            try{
                if(item.param1){
                    item.param1.split('.').forEach(function(i){
                        var items = i.match(/(\w+)\[(\d+)\]/);
                        var subitem = i;
                        var idx;
                        if(items){
                            subitem = items[1]
                            idx=items[2];
                        }
                        if(subitem in data){
                            data=data[subitem];
                        } else {
                            var msg='The response body does not contain item ' + i +  ' in the chain' + item.param1;
                            console.log(msg);
                            throw new Error(msg);
                        }
                        if(idx){
                            data = data[idx]
                        }
                    });
                }
                _isMatch(data, item);
            }
            catch (e){
                var msg = "Parsing result data error" + e.message;
                console.log(msg);
                throw new Error(msg);
            }
        } else if(responseType=='html'){
            // var doc = jsdom(data);
            var d = domain.create();
            d.on('error', function (err) {
                console.log("xx===========" +err);
                // throw  err;
                return "xxx";
            });
            $ = cheerio.load(data);
            // api, https://www.npmjs.com/package/cheerio,https://cnodejs.org/topic/5203a71844e76d216a727d2e
            //inner
            if(item.param1){
                data = eval(item.param1);
                if(!data){
                    throw new Error("Html content not found");
                }
            }
            _isMatch(data, item);

           /* d.run(function(){jsdom.env({
                    html:data,
                    src: [jquery],
                    done: function (err, window) {
                        var $ = window.$;
                        if(item.param1){
                            data = eval(item.param1);
                            if(!data){
                                throw new Error("Html content not found");
                            }
                        }
                        _isMatch(data, item);
                        return "xxx";
                    }
                }

            )});*/



            /*var $ = doc.$;
            if(item.param1){
                data = eval(item.param1);
                if(!data){
                    throw new Error("Html content not found");
                }
            }
            _isMatch(data, item);
*/
        } else{
            throw new Error("Response data type is wrong, it should be json, html etc.");
        }
    }
    catch (err){
        throw  err;
    }
    return ;
};
/*
process.on('uncaughtException', function (err) {
    console.log(err);
});*/

function _isMatch(data, item){
    // parse expect value
    console.log("begin match============");
    var ruleType, expectValue;
    if(item.param2.startsWith('>')){
        ruleType = 1;
        expectValue = item.param2.substr(1);
    }
    else if(item.param2.startsWith('>=')){
        ruleType = 2;
        expectValue = item.param2.substr(2);
    }
    else if(item.param2.startsWith('=')){
        ruleType = 3;
        expectValue = item.param2.substr(1);
    }
    else if(item.param2.startsWith('<=')){
        ruleType = 4;
        expectValue = item.param2.substr(2);
    }
    else if(item.param2.startsWith('<')){
        ruleType = 5;
        expectValue = item.param2.substr(1);
    }
    else {
        ruleType = 6;
        expectValue = item.param2;
    }

    // get actual data
    var actualValue="";
    if (item.type=="count") {
        actualValue = data.length;
        expectValue = parseInt(expectValue);
        if(!data instanceof  Array){
            var msg = "Expect result should be array, but found " + data;
            console.log(msg);
            throw new Error(msg);
        }
    } else if(item.type == "exist"){
        //    already verify before
        return;
    } else if(item.type == "equal"){
        actualValue=data.toString();
    } else if(item.type == "length"){
        actualValue = data.length;
        expectValue = parseInt(expectValue);
    }


    var bPass = true;
    if(ruleType ==1){
        if ( actualValue < expectValue) {
            bPass = false;
        }
    } else if(ruleType==2){
        if ( actualValue <= expectValue) {
            bPass = false;
        }
    } else if(ruleType==3 || ruleType==6){
        if ( actualValue != expectValue) {
            bPass = false;
        }
    } else if(ruleType==4){
        if ( actualValue > expectValue) {
            bPass = false;
        }
    } else if(ruleType==5){
        if ( actualValue >= expectValue) {
            bPass = false;
        }
    }
    // console.log("check result============");
    if(bPass == false){
        var msg ='Expect result of path['+ item.param1 + '] is ' + item.param2 + ' but found '+ actualValue;
        console.log(msg);
        throw new Error(msg);
    }
};


function myArray(location){
    if (location instanceof Array){
        console.log(location.split("."));
        return location.split(".");
    }
    else return [location]
}

function doVerify(check, body) {
// var doVeirfy = function(check, body) {
    /*规则：exist,count
     数据,原始输入数据,到最终的数据
     校验, >0

     */
    if (check.type !== 'http' && check.type !== 'https') return;
    console.log("response body is :" + body);
    if(check.pollerParams ===undefined  || check.pollerParams.verify === undefined) return;
    var verify = check.pollerParams.verify;
    console.log(verify);
    try{
        //判断返回的类型，是html还是json，或者json
        var data;
        var responseType = 'json';
        try{
            data = JSON.parse(body);
        }
        catch (err){
            data = body;
            responseType = 'html';
        }
        /*if(item.type=="length"){
        }
        else {
        }*/

        verify.forEach(function(item, index){
            // item包含type, param1, param2
            // 获取数据
            /*var d = domain.create();
            d.on('error', function (err) {
                console.log("===========" +err);
            });
            d.run();*/
            var out = getData(data, item, responseType);
            // console.log("out" + out);
            /*if(out){
                throw new Error(out);
            }*/
        });
    }
    catch (err) {
        console.log(err);
        throw err;
    }
    return;

}

exports.doVerify = doVerify;


exports.initMonitor = function(options) {
  options.monitor.on('pollerPolled', function(check, res, details) {
      doVerify(check, res.body);
     /* /!*规则：exist,count
      数据,原始输入数据,到最终的数据
      校验, >0
      */
  });
};
