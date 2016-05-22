"use strict";

const fs = require('fs');
const acorn = require('acorn');
const escodegen = require('escodegen');

const TEST_FILE = './test.js';
const testCode = fs.readFileSync(TEST_FILE);

const ast = require('./src/prettify')(acorn.parse(testCode));

const generated = escodegen.generate(ast, {
  format: {
    indent: {
      style: '  '
    }
  }
});

fs.writeFileSync(TEST_FILE + '.out.js', generated);