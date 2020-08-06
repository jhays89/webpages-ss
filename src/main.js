
const fs = require('fs');
const XLSX = require('node-xlsx');
const puppeteer = require('puppeteer');
const pkgcloud = require('pkgcloud');
const Jimp = require('jimp');
const appSettings = require('../appsettings.js');
const store = require('./store.js');

function main(args) {
  store.setArgs(args);

  run();
}

function run() {
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
}

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
    console.log('Saved to Rackspace');
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

  await overlayImages();

  return new Promise((resolve, reject) => {
    console.log('Saving to Rackspace...');
    const readStream = fs.createReadStream('src/assets/screenshot.jpeg');

    const writeStream = client.upload(uploadOptions);
    
    writeStream.on('error', err =>  {
      readStream.unpipe();
      writeStream.unpipe();
    });

    readStream.pipe(writeStream).on('success', response => {
      screenShotUrl += response.name;
      
      readStream.unpipe();
      writeStream.unpipe();

      resolve(screenShotUrl);
    });
  });
}

async function createScreenShot(url) {
  console.log('Capturing screen shot for: ' + url);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setViewport({
    width: store.data.selectedDisplayType.width,
    height: store.data.selectedDisplayType.height,
    deviceScaleFactor: 1,
  });
  
  await page.goto(url, {waitUntil: 'networkidle0'});

  // Uncomment when you want to get full page shot
  // await page.evaluate(async () => {
  //   document.body.scrollIntoView(false);
  
  //   await Promise.all(Array.from(document.getElementsByTagName('img'), image => {
  //     if (image.complete) {
  //       return;
  //     }
  
  //     return new Promise((resolve, reject) => {
  //       image.addEventListener('load', resolve);
  //       image.addEventListener('error', reject);
  //     });
  //   }));
  // });

  await page.screenshot({path: 'src/assets/screenshot.jpeg', type: 'jpeg', quality: 100});

  await browser.close();
};

async function overlayImages() {
  let overlayHeight = 0;
  let overlayPath = store.data.selectedDisplayType.type.toUpperCase() === 'MOBILE' ? 'src/assets/mobile-overlay.png' : 'src/assets/desktop-overlay.png';
  let overlay = await Jimp.read(overlayPath).then(function(image) {
    overlayHeight = image.bitmap.height;
    
    return image;
  });

  const image = await Jimp.read('src/assets/screenshot.jpeg');

  let overlayYCoordinate = store.data.selectedDisplayType.height - overlayHeight;
  
  image.quality(80);
  image.composite(overlay, 0, overlayYCoordinate, {
    mode: Jimp.BLEND_SOURCE_OVER,
    opacityDest: 1,
    opacitySource: 0.8
  });

  await image.writeAsync('src/assets/screenshot.jpeg');
  debugger;
}

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
  console.log('Writing to CSV...');
  const buffer = XLSX.build([{name: 'Webpages-ss', data: file[0].data}]);

  fs.writeFileSync('sample.xlsx', buffer);
  console.log('Process complete.');
}

module.exports = main;