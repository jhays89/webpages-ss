
const fs = require('fs');
const XLSX = require('node-xlsx');
const puppeteer = require('puppeteer');
const pkgcloud = require('pkgcloud');
const appSettings = require('../appsettings.js');

function main(args) {
  let file = XLSX.parse('sample.xlsx');
  let rows = file[0].data;

  let nameRow = rows[0];
  const urlIndex = getUrlIndex(nameRow);
  const ssUrlIndex = getSsUrlIndex(nameRow, file);

  
  try {
    generateScreenShots(file, rows, urlIndex, ssUrlIndex);
  }
  catch(err) {
    console.log(err);
  }
};

async function generateScreenShots(file, rows, urlIndex, ssUrlIndex) {
  const client = pkgcloud.storage.createClient(appSettings.rackspace);

  for(let i = 1; i < rows.length; i++) { // i = 1 to skip the first row of the spreadsheet (column names)
    await generateScreenShot(client, rows[i], i, file, urlIndex, ssUrlIndex);
  }

  writeToFile(file);
}

async function generateScreenShot(client, row, rowIndex, file, urlIndex, ssUrlIndex) {
  await getScreenShotUrl(client, row[urlIndex])
  .then(response => {
    row[ssUrlIndex] = response;
    file[0].data[rowIndex] = row;
  })
  .catch(err => {
    throw err;
  });
}

async function getScreenShotUrl(client, url) {
  let screenShotUrl = appSettings.rackspace.urlPrefix;
  
  const uploadOptions = {
    container: 'webpages',
    remote: 'webpages-' + new Date().getTime(),
  };
  
  try {
    await createScreenShot(url);
  }
  catch(err) {
    throw err;
  }

  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream('screenshot.jpeg');

    const writeStream = client.upload(uploadOptions);
    
    writeStream.on('error', err =>  {
      readStream.unpipe();
      writeStream.unpipe();
      
      throw err;
    });
    
  readStream.pipe(writeStream).on('success', response => {
      screenShotUrl += response.name;
      resolve(screenShotUrl);

      readStream.unpipe();
      writeStream.unpipe();
    });
  });
}

async function createScreenShot(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  await page.screenshot({fullPage: true, path: 'screenshot.jpeg', type: 'jpeg', quality: 20});

  await browser.close();
};

function getUrlIndex(nameRow) {
  let urlIndex = null;

  nameRow.forEach((name, index) => { 
    if(name.toUpperCase() === 'URL') {
      urlIndex = index;
    }
  });

  return urlIndex;
}

function getSsUrlIndex(nameRow, file) {
  let ssUrlIndex = null;

  nameRow.forEach((name, index) => {
    if(name.toUpperCase() === 'SCREENSHOTURL') {
      ssUrlIndex = index;
    }
  });

  if(ssUrlIndex === null) {
    createSsUrlColumn(file);
    ssUrlIndex = nameRow.length - 1;
  }

  return ssUrlIndex;
}

function createSsUrlColumn(file) {
  file[0].data[0].push('ScreenShotUrl');
  writeToFile(file);
}

function writeToFile(file) {
  const buffer = XLSX.build([{name: 'Webpages-ss', data: file[0].data}]);

  fs.writeFileSync('sample.xlsx', buffer);
}

module.exports = main;