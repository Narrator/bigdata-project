const csv = require('csvtojson');
const async = require('async');
const moment = require('moment-timezone');
const jsonfile = require('jsonfile');
const json2csv = require('json2csv');
const fs = require('fs');

var fields = ['Title', 'Date', 'Body', 'Age', 'Location',
  'Phone', 'Gender', 'Prostituition', 'Safe Search',
  'Undergarment Sum', 'Undergarment Count', 'Lingerie Sum',
  'Lingerie Count', 'Model Sum', 'Model Count', 'Camgirl Sum',
  'Camgirl Count', 'Brassiere Sum', 'Brassiere Count', 'Call Girl Sum',
  'Call Girl Count', 'Glasses Sum', 'Glasses Count', 'Selfie Sum',
  'Selfie Count', 'Source'];

var final = [];
jsonfile.readFile('results/11-30-2017/back-page.json', function(err, data) {
  data.forEach(function(d) {
    var listing = d;
    var columns = ['Glasses', 'Model', 'Undergarment', 'Lingerie', 'Brassiere',
      'Call Girl',  'Camgirl', 'Selfie']

    for (var col of columns) {
      listing[col + ' Sum'] = 0;
      listing[col + ' Count'] = 0;
    }

    if (!d['Labels'] || !d['Labels'].length) {
      return release();
    }
    d['Labels'].forEach(function(l) {
      console.log(l);
      if (l.name === 'undergarment' || l.name === 'active undergarment' ||
        l.name === 'underpants' || l.name === 'briefs') {
        listing['Undergarment Sum'] += l.score;
        listing['Undergarment Count'] += 1;
      }
      if (l.name === 'lingerie') {
        listing['Lingerie Sum'] += l.score;
        listing['Lingerie Count'] += 1;
      }
      if (l.name === 'model' || l.name === 'supermodel' ||
        l.name === 'fashion model' || l.name === 'art model' ||
        l.name === 'fetish model' || l.name === 'black model') {
        listing['Model Sum'] += l.score;
        listing['Model Count'] += 1;
      }
      if (l.name === 'camgirl') {
        listing['Camgirl Sum'] += l.score;
        listing['Camgirl Count'] += 1;
      }
      if (l.name === 'brassiere') {
        listing['Brassiere Sum'] += l.score;
        listing['Brassiere Count'] += 1;
      }
      if (l.name === 'call girl') {
        listing['Call Girl Sum'] += l.score;
        listing['Call Girl Count'] += 1;
      }
      if (l.name === 'glasses' || l.name === 'sunglasses') {
        listing['Glasses Sum'] += l.score;
        listing['Glasses Count'] += 1;
      }
      if (l.name === 'selfie') {
        listing['Selfie Sum'] += l.score;
        listing['Selfie Count'] += 1;
      }
    });
    release();
    function release() {
      delete listing.Labels;
      listing['Source'] = 'OkCupid';
      final.push(listing);
    }
  });
  var result = json2csv({ data: final, fields: fields});
  fs.writeFile('./results/11-30-2017/back-page.csv',
    result, function(err) {
      if (err) {
        console.log(err);
        throw err;
      }
      console.log('appended to file ');
    });
});
