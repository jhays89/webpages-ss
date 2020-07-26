const xlsx = require('node-xlsx');
const puppeteer = require('puppeteer');

const main = (args) => {
  //console.log(`Hello, ${args.name}, ${args.title}`);
  // Will need to validate args => ValidateArgs(args) == use try-catch return error descirbing wtf is wrong
  // check if webpages.ext exists. if not, return error message stating what user needs to do
  var file = xlsx.parse('sample.xlsx');
  const rows = file[0].data;
  const urls = getUrlsFromRows(rows);
  getScreenShots(urls);

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

async function getScreenShots(urls) {
  var url = urls[0];

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  const base64String = await page.screenshot({fullPage: true, encoding: 'base64'});
  
  await browser.close();
};

module.exports = main;