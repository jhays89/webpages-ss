
const fs = require('fs');
const xlsx = require('node-xlsx');
const puppeteer = require('puppeteer');
const pkgcloud = require('pkgcloud');
const appSettings = require('../appsettings.js');

async function main(args) {
  //console.log(`Hello, ${args.name}, ${args.title}`);
  // Will need to validate args => ValidateArgs(args) == use try-catch return error descirbing wtf is wrong
  // check if webpages.ext exists. if not, return error message stating what user needs to do
  var file = xlsx.parse('sample.xlsx');
  const rows = file[0].data;
  const urls = getUrlsFromRows(rows);

  try {

    await GetScreenShot(urls);

    const client = pkgcloud.storage.createClient(appSettings.rackspace);

    // var fileName = 'example-' + new Date().toISOString();
    // var contentType = 'image/png';
    //const buff = Buffer.from(base64EncodedFile, 'base64');
    //var size = fs.statSync('screenshot.png')['size'];

    const readStream = fs.createReadStream('screenshot.jpeg'); // issue is probably here - try using bytes instead. It doesn't like the base64

    // const options = {
    //   container: 'webpages',
    //   remote: fileName,
    //   contentType: contentType,
    //   size: size
    // };
    
    const options = {
      container: 'webpages',
      remote: 'webpages-' + new Date().getTime(),
    };
    
    const writeStream = client.upload(options);
    
    writeStream.on('error', function(err) {
      removeScreenShot();
      console.log(err)
    });
    
    writeStream.on('success', function(file) {
      removeScreenShot();
      // need to get name from the callback and then go fetch it for the url??? sucks ass man
      const test = file;
    });

    writeStream.on('unpipe', function(file) {
      removeScreenShot();
      console.log("unpipe");
    });

    writeStream.on('end', function(file) {
      removeScreenShot();
      console.log("end");
    });

    // writeStream.on('data', function(file) {
    //   removeScreenShot();
    //   console.log("data");
    // });
    
    const rackspaceUrl = readStream.pipe(writeStream);

    const test = "dd";
    
    // parse webpages.ext
    // run puppeteer on URLS
    // save images to rackspace
    // update webpages.ext with rackpace URLS
  }
  catch(err) {
    const test = err;
  }
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

async function GetScreenShot(urls) {
  var url = urls[0];

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  await page.screenshot({fullPage: true, path: 'screenshot.jpeg', type: 'jpeg', quality: 20});

  await browser.close();
};

function removeScreenShot() {
  fs.unlink('screenshot.jpeg', (err) => {
    
  });
}

module.exports = main;