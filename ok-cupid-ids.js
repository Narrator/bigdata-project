'use strict';

const request = require('request');
const async = require('async');
const json2csv = require('json2csv');
const fs = require('fs');
const jsonfile = require('jsonfile');
const times = 1;

String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

var asyncArray = [];
for (var j = 0; j < times; j++) {
  asyncArray.push(1);
}

var users = [];

var fields = ['username', 'userId', 'location', 'gender'];
var counter = 0;

/*async.each(asyncArray, function(item, next) {
  request
    .post({url: 'https://www.okcupid.com/1/apitun/match/search', body: {
      "order_by": "SPECIAL_BLEND",
      "minimum_age": 18,
      "maximum_age": 40,
      "i_want": "women",
      "they_want": "men",
      "availability": "any",
      "save_search": true,
      "limit": 10,
      "fields": "userinfo,thumbs,essays"
    }, headers: {
      'Authorization': 'Bearer 1,0,1509156273,0xe27296f1d2c9703c;e81e8741813276f9ee25e4ea623460784b1e9c8b'
    }, json: true}, function(err, response, body) {
      console.log(err, response, body);
      if (err) {
        return next(err);
      }
      if (!body || !body.data || !body.data.length) {
        return next();
      }
      var usersList = body.data;
      console.log('TOTAL USERS: ' + usersList.length);
      async.each(usersList, function(user, cb) {
        if (user.userinfo && user.userinfo.location &&
          user.userinfo.gender_letter === 'F') {
          var location = user.userinfo.location;
          location = location.split(', ')[1];
          if (location === 'United States') {
            if (user.username && user.userid) {
              if (!user.essays || !user.essays.length) {
                return cb();
              }
              console.log('Processing user #' + counter + ' : ' + user.username);
              var photos = [];
              var body = '';
              if (user.thumbs && user.thumbs.length) {
                for (var k = 0; k < user.thumbs.length; k++) {
                  var photo = user.thumbs[k];
                  if (photo['400x400']) {
                    photos.push(photo['400x400'])
                  }
                }
              }
              if (user.essays && user.essays.length) {
                for (var l = 0; l < user.essays.length; l++) {
                  if (!user.essays[l].clean_content) {
                    continue;
                  }
                  body = body + ' ' + user.essays[l].raw_content;
                  body = body.replace(/[^\w\s]/gi, '');
                  body = body.replaceAll('   ', ' ');
                  body = body.replaceAll('  ', ' ');
                  body = body.replaceAll('\n', ' ');
                }
              }
              if (!body) {
                return cb();
              }
              var phone = false;
              var phoneExp = /(\(\d{3}\))?[\s-]?\d{3}[\s-]?\d{4}/img;
              if (phoneExp.test(body)) {
                phone = true;
              }
              var listing = {
                title: user.username,
                location: user.userinfo.location.split(', ')[0],
                gender: user.userinfo.gender_letter,
                age: user.userinfo.age,
                photos: photos,
                body: body,
                phone: phone,
                prostituition: false
              };
              counter++
              console.log(counter);
              jsonfile.writeFile('results/11-29-2017/ok-cupid-ids.json', listing, {flag: 'a'}, function (err) {
                if (err) {
                  console.log(err);
                  return cb(err);
                }
                cb();
              });
            } else {
              return cb();
            }
          } else {
            return cb();
          }
        } else {
          return cb();
        }
      }, function(err) {
        if (err) {
          return next(err);
        }
        next();
      });
    });
}, function(err) {
  if (err) {
    console.log(err);
  }
  /*var result = json2csv({ data: users, fields: fields });
  console.log(result);
  fs.writeFile('okCupid.csv', result, function(err) {
    if (err) throw err;
    console.log('file saved');
  });
});*/

  request
    .post({url: 'https://www.okcupid.com/1/apitun/match/search', body: {
      "order_by": "SPECIAL_BLEND",
      "minimum_age": 18,
      "maximum_age": 40,
      "i_want": "women",
      "they_want": "men",
      "availability": "any",
      "save_search": true,
      "limit": 500,
      "fields": "userinfo,thumbs,essays"
    }, headers: {
      'Authorization': 'Bearer 1,0,1509156273,0xe27296f1d2c9703c;e81e8741813276f9ee25e4ea623460784b1e9c8b'
    }, json: true}, function(err, response, body) {
      if (err) {
        throw err;
      }
      if (!body || !body.data || !body.data.length) {
        return;
      }
      var usersList = body.data;
      console.log('TOTAL USERS: ' + usersList.length);
      async.each(usersList, function(user, cb) {
        if (user.userinfo && user.userinfo.location &&
          user.userinfo.gender_letter === 'F') {
          var location = user.userinfo.location;
          location = location.split(', ')[1];
          if (location === 'United States') {
            if (user.username && user.userid) {
              if (!user.essays || !user.essays.length) {
                return cb();
              }
              console.log('Processing user #' + counter + ' : ' + user.username);
              var photos = [];
              var body = '';
              if (user.thumbs && user.thumbs.length) {
                for (var k = 0; k < user.thumbs.length; k++) {
                  var photo = user.thumbs[k];
                  if (photo['400x400']) {
                    photos.push(photo['400x400'])
                  }
                }
              }
              if (user.essays && user.essays.length) {
                for (var l = 0; l < user.essays.length; l++) {
                  if (!user.essays[l].clean_content) {
                    continue;
                  }
                  body = body + ' ' + user.essays[l].raw_content;
                  body = body.replace(/[^\w\s]/gi, '');
                  body = body.replaceAll('   ', ' ');
                  body = body.replaceAll('  ', ' ');
                  body = body.replaceAll('\n', ' ');
                }
              }
              if (!body) {
                return cb();
              }
              var phone = false;
              var phoneExp = /(\(\d{3}\))?[\s-]?\d{3}[\s-]?\d{4}/img;
              if (phoneExp.test(body)) {
                phone = true;
              }
              var listing = {
                title: user.username,
                location: user.userinfo.location.split(', ')[0],
                gender: user.userinfo.gender_letter,
                age: user.userinfo.age,
                photos: photos,
                body: body,
                phone: phone,
                prostituition: false
              };
              counter++
              console.log(counter);
              jsonfile.writeFile('results/11-29-2017/ok-cupid-ids.json', listing, {flag: 'a'}, function (err) {
                if (err) {
                  console.log(err);
                  return cb(err);
                }
                cb();
              });
            } else {
              return cb();
            }
          } else {
            return cb();
          }
        } else {
          return cb();
        }
      }, function(err) {
        if (err) {
          throw err;
        }
        return;
      });
    });
