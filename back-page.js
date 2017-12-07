'use strict';

const osmosis = require('osmosis');
const json2csv = require('json2csv');
const fs = require('fs');
const moment = require('moment-timezone');
const async = require('async');
const vision = require('@google-cloud/vision')
const jsonfile = require('jsonfile')

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
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

 var client = vision({
  projectId: 'visionproject-183801',
  keyFilename: 'credentials/visionproject-0a63955aaa2f.json'
 });

var locations = [];
var dataArray = [];
var cities = [];
var counter = 0;
var fields = ['Title', 'Date', 'Body', 'Age', 'Location',
  'Phone', 'Gender', 'Prostituition', 'Labels', 'Safe Search'];
var main = osmosis
  .get('http://us.backpage.com/')
  .find('div.geoUnit ul li')
  .set({
    'link': 'a@href',
    'name': 'a'
  })
  .data(function(listing) {
    cities.push(listing);
  })
  .done(function() {
    async.eachSeries(cities, function(city, next) {
      let adLength = 500;
      let ads = 0;
      let locationUrl = city.link + '/WomenSeekMen/';
      var locationName = city.name;
      var cityData = [];
      let adList = osmosis
        .get(locationUrl)
        .paginate('div.pagination a.pagination.next', 50)
        .find('div.cat a')
        .follow('@href')
        /*.then(function(context, d) {
          if (ads > adLength) {
            adList.stop();
          }
          ads++;
        })*/
        .set({
          'Title': 'div#postingTitle h1',
          'Date': 'div.adInfo',
          'Body':'div.posting div.postingBody',
          'Age': 'div.posting p.metaInfoDisplay',
          'Photos': ['ul#viewAdPhotoLayout li img@src'],
        })
        .data(function(listing) {
          cityData.push(listing);
        })
        .done(function () {
          async.eachSeries(cityData, function(listing, cb) {
            if (Object.keys(listing).length < 1) {
              return cb();
            }
            if (listing['Photos']) {
              var labels = [];
              var safeSearch = 0;
              var requests = [];
              listing['Photos'].forEach(function(photo) {
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
                      listing['Labels'] = [];
                      listing['Safe Search'] = -1;
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
                  listing['Labels'] = labels;
                  listing['Safe Search'] = safeSearch;
                  release();
                })
                .catch(function(err) {
                  console.error(err);
                  listing['Labels'] = [];
                  listing['Safe Search'] = -1;
                  release();
                });
            } else {
              listing['Labels'] = [];
              listing['Safe Search'] = -1;
              release();
            }
            function release() {
              delete listing['Photos'];
              if (listing['Title']) {
                listing['Title'] = listing['Title'].replace(/[^\w\s]/gi, '');
                listing['Title'] = listing['Title'].replaceAll('   ', ' ');
                listing['Title'] = listing['Title'].replaceAll('  ', ' ');
              }
              listing['Phone'] = false;

              if (listing['Body']) {
                listing['Body'] = listing['Body'].replace(/[^\w\s]/gi, '');
                listing['Body'] = listing['Body'].replaceAll('   ', ' ');
                listing['Body'] = listing['Body'].replaceAll('  ', ' ');
                listing['Body'] = listing['Body'].replaceAll('\n', ' ');

                var phoneExp = /(\(\d{3}\))?[\s-]?\d{3}[\s-]?\d{4}/img;
                if (phoneExp.test(listing['Body'])) {
                  listing['Phone'] = true;
                }
              }
              if (listing['Date']) {
                listing['Date'] = listing['Date'].split(':\r\n    ')[1];
                listing['Date'] = new Date(listing['Date']);
                listing['Date'] = moment.tz(listing['Date'], 'America/Chicago');
                listing['Date'] = listing['Date'].format('YYYY-MM-DD HH:mm:ss');
              }
              listing['Location'] = locationName;
              if (listing['Age']) {
                listing['Age'] = listing['Age'].split(': ')[1];
              }
              if (!listing['Title'] && !listing['Body'] && !listing['Date'] &&
                !listing['Age']) {
                return cb();
              }
              listing['Prostituition'] = true;
              listing['Gender'] = 'female';
              listing['source'] = 'BackPage';
              var today = (moment.tz(new Date(), 'America/Chicago')).
                format('MM-DD-YYYY');
              var fileName = 'results/11-30-2017/back-page.json';
              jsonfile.writeFile(fileName, listing, {flag: 'a'}, function (err) {
                if (err) {
                  console.log(err);
                  throw err;
                }
                counter++;
                console.log(counter);
                cb();
              })
              //var result = json2csv({ data: cityData, fields: fields});
              /*fs.appendFile(fileName,
                result, function(err) {
                  if (err) {
                    console.log(err);
                    throw err;
                  }
                  console.log('appended to file ' + fileName);
                  cb();
                });*/
            }
          }, function(err) {
            next();
          });
        });
    }, function (err) {

    });
  });
