"use strict";

const acorn = require('acorn');
const escodegen = require('escodegen');

const astPrettify = require('./src/prettify');

function prettify(code) {
  const ast = astPrettify(acorn.parse(code), false, true);

  return escodegen.generate(ast, {
    format: {
      indent: {
        style: '  '
      }
    }
  });
}

module.exports = prettify;