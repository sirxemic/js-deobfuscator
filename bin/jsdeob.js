#!/usr/bin/env node
'use strict';

var path = require('path');
var fs = require('fs');

var prettify = require('../lib').prettify;

/**
 *  Show usage and exit.
 */
function help(status) {
  var print = status == 0 ? console.log : console.error;

  print('Usage: ' + path.basename(process.argv[1]) + ' [--ecma3|--ecma5|--ecma6|--ecma7]');
  print('       [--indent=NUM] [--help] [--] [infile]');

  process.exit(status);
}

/**
 *  Run the prettifier.
 */
function run(code, options) {
  try {
    var result = prettify(code, options);
    console.log(result);
  }
  catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

/**
 *  Run the prettifier using a file as input.
 */
function runFromFile(file, options) {
  var code = fs.readFileSync(file, 'utf8');
  run(code, options);
}

/**
 *  Run the prettifier using stdin as input.
 */
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

/**
 *  Parse and return the prettifier options from the process arguments.
 */
function parseArguments() {
  var options = {};

  for (var i = 2; i < process.argv.length; i++) {
    var m, arg = process.argv[i];
    if ((arg == '-' || arg[0] != '-') && !options.file) {
      options.file = arg;
    }
    else if (arg == '--' && !options.file && i + 2 == process.argv.length) {
      options.forceFile = options.file = process.argv[++i];
    }
    else if (arg == '--ecma3') {
      options.ecmaVersion = 3;
    }
    else if (arg == '--ecma5') {
      options.ecmaVersion = 5;
    }
    else if (arg == '--ecma6') {
      options.ecmaVersion = 6;
    }
    else if (arg == '--ecma7') {
      options.ecmaVersion = 7;
    }
    else if (arg == '--indent' && i + 1 < process.argv.length) {
      var indent = parseInt(process.argv[++i]);
      if (isNaN(indent)) {
        help(1);
      }
      options.indent = indent;
    }
    else if ((m = arg.match(/--indent=(\d+)/))) {
      var indent = parseInt(m[1]);
      if (isNaN(indent)) {
        help(1);
      }
      options.indent = indent;
    }
    else if (arg == '--help') {
      help(0);
    }
    else {
      help(1);
    }
  }

  return options;
}

/**
 *  Main.
 */
var options = parseArguments();

if (options.forceFile || options.file && options.file != '-') {
  runFromFile(options.file, options);
} else {
  runFromStdin(options);
}