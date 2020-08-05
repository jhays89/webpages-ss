#!/usr/bin/env node
const yargs = require('yargs');
const main = require('../src/main.js');

const args = yargs.usage("Usage: -d <name>") // TODO these are just placeholder options
.option("d", { alias: "display", describe: "mobile / desktop", type: "string", demandOption: false })
.argv;

main(args);