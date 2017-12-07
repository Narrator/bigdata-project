'use strict';

const csv = require('csvtojson');
const async = require('async');
const request = require('request');
const jsdom = require('jsdom');
const moment = require('moment-timezone');
const jsonfile = require('jsonfile');
const vision = require('@google-cloud/vision');
const { JSDOM } = jsdom;

var merged = [];
var cookieString = '__cfduid=d600987b7c762d57a6215360c13c21fad1508642707; ab.storage.deviceId.719f8d59-40d7-4abf-b9c3-fa4bf5b7cf54=%7B%22g%22%3A%228ac89059-9376-3ab3-1ff6-c5cff4852ca9%22%2C%22c%22%3A1508642711708%2C%22l%22%3A1508642711708%7D; __ssid=dcb2c207-16e4-4df6-ab43-7a39283179ad; ab.storage.userId.719f8d59-40d7-4abf-b9c3-fa4bf5b7cf54=%7B%22g%22%3A%2216317270365284429884%22%2C%22c%22%3A1508797768787%2C%22l%22%3A1508797768787%7D; override_session=0; authlink=5b680a11ae68e654; secure_login=1; secure_check=1; session=16317270365284429884%3a18193889165258080376; siftsession=9de14bdf9195826a6bde; ab.storage.sessionId.719f8d59-40d7-4abf-b9c3-fa4bf5b7cf54=%7B%22g%22%3A%2273a74ef8-df0b-2e88-a780-f97e4da200c9%22%2C%22e%22%3A1509124873233%2C%22c%22%3A1509123073221%2C%22l%22%3A1509123073233%7D; amplitude_id_desktopokcupid.com=eyJkZXZpY2VJZCI6ImJhYWY1ZjEwLWFmNWUtNDQ0Mi1hODNmLWNlOGVkNzVkZjhmNlIiLCJ1c2VySWQiOiIxNjMxNzI3MDM2NTI4NDQyOTg4NCIsIm9wdE91dCI6ZmFsc2UsInNlc3Npb25JZCI6MTUwOTEyMzA3MzM2MywibGFzdEV2ZW50VGltZSI6MTUwOTEyMzA3MzM2OSwiZXZlbnRJZCI6MTc5LCJpZGVudGlmeUlkIjoxMDgsInNlcXVlbmNlTnVtYmVyIjoyODd9; nano=k%3Diframe_prefix_lock_1%2Ce%3D1509123078440%2Cv%3D1';
var fields = ['Title', 'Date', 'Body', 'Age', 'Location',
  'Phone', 'Gender', 'Prostituition', 'Labels', 'Safe Search'];

 var client = vision({
  projectId: 'visionproject-183801',
  keyFilename: 'credentials/visionproject-0a63955aaa2f.json'
 });

String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}


function dedupe(arr) {
  return arr.reduce(function (p, c) {

    // create an identifying id from the object values
    var id = c.title;

    // if the id is not found in the temp array
    // add the object to the output array
    // and add the key to the temp array
    if (p.temp.indexOf(id) === -1) {
      p.out.push(c);
      p.temp.push(id);
    }
    return p;

  // return the deduped array
  }, { temp: [], out: [] }).out;
}
var counter = 0;
jsonfile.readFile('results/11-29-2017/ok-cupid-ids.json', function(err, users) {
  users = dedupe(users);
  var offset = 0;
  var limit = 25;
  setInterval(function() {
    var sets = users.slice(offset, limit);
    offset += 25;
    limit += 25;
    async.each(sets, function(user, next) {
      var labels = [];
      var safeSearch = 0;
      if (!user.photos || !user.photos.length) {
        safeSearch = -1;
        return release();
      }
      var requests = [];
      user.photos.forEach(function(photo) {
        var image = {
          source : {
            imageUri: photo,
          }
        };
        var labelElement = {
          type : vision.v1.types.Feature.Type.LABEL_DETECTION
        };
        var safeSearchElement = {
          type : vision.v1.types.Feature.Type.SAFE_SEARCH_DETECTION
        };
        var features = [labelElement, safeSearchElement];
        var requestsElement = {
           image : image,
           features : features
        };
        requests.push(requestsElement);
      });
      if (requests.length > 5) {
        requests = requests.slice(0, 5);
      }
      client
        .batchAnnotateImages({requests: requests})
        .then(function(responses) {
          responses.forEach(function(response) {
            if (!response.responses) {
              return release();
            }
            response.responses.forEach(function(resp) {
              var labelAnnotations =
                resp.labelAnnotations;
              var safeSearchAnnotation =
                resp.safeSearchAnnotation;
              labelAnnotations.forEach(function(label) {
                labels.push({
                  name: label.description,
                  score: label.score,
                });
              });
              if (safeSearchAnnotation && safeSearchAnnotation.adult) {
                var adult = safeSearchAnnotation.adult
                if (adult === 'POSSIBLE') {
                  safeSearch += 1;
                }
                if (adult === 'LIKELY') {
                  safeSearch += 2;
                }
                if (adult === 'VERY_LIKELY') {
                  safeSearch += 3;
                }
              }
            });
          });
          release();
        })
        .catch(function(err) {
          console.error(err);
          release();
        });
      function release () {
        var listing = {
          'Title': user.username,
          'Date': user.date,
          'Body': user.body,
          'Age': user.age,
          'Location': user.location,
          'Phone': user.phone,
          'Gender': user.gender,
          'Prostituition': user.prostituition,
          'Labels': labels,
          'Safe Search': safeSearch,
        };
        counter++;
        console.log(counter);
        jsonfile.writeFile('results/11-29-2017/ok-cupid.json', listing, {flag: 'a'}, function (err) {
          if (err) {
            console.log(err);
            throw err;
          }
          next();
        })
      }
    }, function(err) {
      console.log('done');
    });
  }, 10000);
});
