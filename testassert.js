/**
 * Created by zhangtao on 2016/4/12.
 */

var expect = require('chai').expect
var chai = require('chai');
//var like = require('chai-like');
//chai.use(like);
var should = require('chai').should()
var assert = require('chai').assert
    , foo = 'bar'
    , beverages = { tea: [ 'chai', 'matcha', 'oolong' ] };
var my ={
    "meta": {
        "errno": 0,
        "msg": "success"
    },
    "result": {
        "goodsList":[
            {"activityType":1},{"activityType":2}
        ]

    }
}
assert.lengthOf(my.result.goodsList,2,"goods length");
assert.typeOf(foo, 'string'); // without optional message
assert.typeOf(foo, 'string', 'foo is a string'); // with optional message
assert.equal(foo, 'bar', 'foo equal `bar`');
assert.lengthOf(foo, 3, 'foo`s value has a length of 3');
assert.lengthOf(beverages.tea, 3, 'beverages has 3 types of tea');

expect(foo).to.be.a('string');
expect(foo).to.equal('bar');
expect(foo).to.have.length(3);
expect(beverages).to.have.property('tea').with.length(3);


// var a={"result":{"goodList"}}

var a = {
    id: 1,
    name: 'test',
    updatedAt: 'now'
};
// try{
//     a.should.like({
//         name: 'test1'
//     });
// }
// catch (e) {
//     console.log(e);
// }
//
// a.should.not.like({
//     name: 'test1'
// });
