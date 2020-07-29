#!/usr/bin/env node
const yargs = require('yargs');
const main = require('../src/main.js');

const args = yargs.usage("Usage: -n <name>") // TODO these are just placeholder options
.option("n", { alias: "name", describe: "Your name", type: "string", demandOption: false })
.option("t", { alias: "title", describe: "Your title", type: "string", demandOption: false })
.argv;

main(args);