#!/usr/bin/env node
"use strict";

var path = require('path');
var fs = require('fs');

var jsDeob = require('../index');

function help(status) {
  var print = status == 0 ? console.log : console.error;

  print('usage: ' + path.basename(process.argv[1]) + ' [--help] [--] [infile]');

  process.exit(status);
}

function run(code, options) {
  try {
    var result = jsDeob(code);
    console.log(result);
  }
  catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

function runFromFile(file, options) {
  var code = fs.readFileSync(file, 'utf8');
  run(code, options);
}

function runFromStdin(options) {
  var code = '';

  process.stdin.resume();
  process.stdin.on('data', function (chunk) {
    code += chunk;
    return code;
  });
  process.stdin.on('end', function () {
    return run(code, options);
  });
}

function parseArguments() {
  var options = {};

  for (var i = 2; i < process.argv.length; i++) {
    var arg = process.argv[i];
    if ((arg == '-' || arg[0] != '-') && !options.file) {
      options.file = arg;
    }
    else if (arg == '--' && !options.file && i + 2 == process.argv.length) {
      options.forceFile = options.file = process.argv[++i];
    }
    else if (arg == '--help') help(0);
    else help(1);
  }

  return options;
}

var options = parseArguments();

if (options.forceFile || options.file && options.file != '-') {
  runFromFile(options.file, options);
} else {
  runFromStdin(options);
}