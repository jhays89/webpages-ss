
const fs = require('fs');
const xlsx = require('node-xlsx');
const puppeteer = require('puppeteer');
const pkgcloud = require('pkgcloud');
const appSettings = require('../appsettings.js');

async function  main(args) {
  //console.log(`Hello, ${args.name}, ${args.title}`);
  // Will need to validate args => ValidateArgs(args) == use try-catch return error descirbing wtf is wrong
  // check if webpages.ext exists. if not, return error message stating what user needs to do
  var file = xlsx.parse('sample.xlsx');
  const rows = file[0].data;
  const urls = getUrlsFromRows(rows);
  const binaryFile = await getBinaryFile(urls);

  const client = pkgcloud.storage.createClient(appSettings.rackspace);
  var source = fs.createReadStream(binaryFile);
  var dest = client.upload({
    container: 'sample-container-test',
    remote: 'somefile.txt'
  });
  
  dest.on('error', function(err) {
    // TODO handle err as appropriate
  });
  
  dest.on('success', function(file) {
    // TODO handle successful upload case
  });
  
  // pipe the source to the destination
  
  //START HERE https://github.com/pkgcloud/pkgcloud/blob/HEAD/docs/providers/rackspace/storage.md#clientuploadoptions
  source.pipe(dest);
  
  // parse webpages.ext
  // run puppeteer on URLS
  // save images to rackspace
  // update webpages.ext with rackpace URLS
};

const getUrlsFromRows = (rows) => {
  const urls = [];
  for(var i = 1; i < rows.length; i++) {
    const row = rows[i];
    const url = row[0];
    urls.push(url);
  }

  return urls;
};

async function getBinaryFile(urls) {
  var url = urls[0];

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  const binaryFile = await page.screenshot({fullPage: true, encoding: 'base64'});

  await browser.close();

  return binaryFile;
};

module.exports = main;