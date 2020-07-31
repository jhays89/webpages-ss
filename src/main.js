
const fs = require('fs');
const xlsx = require('node-xlsx');
const puppeteer = require('puppeteer');
const pkgcloud = require('pkgcloud');
const appSettings = require('../appsettings.js');

async function main(args) {
  const file = xlsx.parse('sample.xlsx');
  const rows = file[0].data;
  const urls = getUrlsFromRows(rows);
  const url = appSettings.rackspace.urlPrefix;

  const uploadOptions = {
    container: 'webpages',
    remote: 'webpages-' + new Date().getTime(),
  };

  // TODO loop over urls
  // Get url
  // Update appropriate 
  
  try {
    await GetScreenShot(urls);

    const client = pkgcloud.storage.createClient(appSettings.rackspace);

    const readStream = fs.createReadStream('screenshot.jpeg');

    const writeStream = client.upload(uploadOptions);
    
    writeStream.on('error', err =>  {
      console.log(err)
    });
    
    writeStream.on('success', response => {
      url += response.name;
    });
    
    readStream.pipe(writeStream);
  }
  catch(err) {
    console.log(err);
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