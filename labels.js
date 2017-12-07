const csv = require('csvtojson');
const async = require('async');
const moment = require('moment-timezone');
const jsonfile = require('jsonfile');
const json2csv = require('json2csv');
const fs = require('fs');

var fields = ['Label', 'Count', 'Score'];

var labels = [];
jsonfile.readFile('results/11-30-2017/back-page.json', function(err, data) {
  var groups = {};
  data.forEach(function(d) {
    if (d['Labels'].length) {
      d['Labels'].forEach(function(l) {
        labels.push(l);
      });
    }
  });
  var groups = {};
  for (var i = 0; i < labels.length; i++) {
    var groupName = labels[i].name;
    if (!groups[groupName]) {
      groups[groupName] = {
        'Label': groupName,
        'Score': 0,
        'Count': 0,
      };
    }
    groups[groupName]['Score'] += labels[i].score;
    groups[groupName]['Count'] += 1;
  }
  console.log(groups);
  var dataArray = [];
  for (var g in groups) {
    dataArray.push([groups[g]][0]);
  }
  console.log(dataArray);
  var result = json2csv({ data: dataArray, fields: fields });
  //console.log(result);
  fs.writeFile('results/11-30-2017/back-page-labels.csv', result, function(err) {
    if (err) throw err;
    console.log('file saved');
  });
});
