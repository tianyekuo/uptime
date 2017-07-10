/**
 * Created by zhangtao on 2016/5/9.
 */
var qs = require("querystring");

function md5(data) {
    var Buffer = require("buffer").Buffer;
    var buf = new Buffer(data);
    var str = buf.toString("binary");
    var crypto = require("crypto");
    return crypto.createHash("md5").update(str).digest("hex");
}

exports.preprocessUrl = function(url, http_sign) {
    var new_url = url;
    if(http_sign ==='bdata'){
	// to be implemented 
        new_url = url +"&sign=" + sign;
    }
    return new_url;
};
