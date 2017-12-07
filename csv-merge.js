'use strict';

const testFolder = './results-big/';
const fs = require('fs');
const csv = require('csvtojson');
const async = require('async');
const fields = ['Title', 'Date', 'Body', 'Age', 'Location'];
const json2csv = require('json2csv');
var merged = [];

fs.readdir(testFolder, (err, files) => {
  async.each(files, function(file, next) {
    let csvFilePath = file;
    csv()
      .fromFile(testFolder + csvFilePath)
      .on('json',(jsonObj)=>{
        merged.push(jsonObj);
      })
      .on('done',(error)=>{
        console.log('end');
        next();
      });
  }, function(err) {
    var result = json2csv({ data: merged, fields: fields});
    fs.writeFile(testFolder + 'big-data.csv', result, function(err) {
      if (err) throw err;
      console.log('file saved');
    });
  });
})
