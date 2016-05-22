'use strict';

const acorn = require('acorn');
const escodegen = require('escodegen');

const prettifyAst = require('./prettify');

/**
 *  Deobfuscate/prettify a chunk of code.
 *
 *  @param  string  code    The code to deobfuscate.
 *  @param  object  options Options. Allowed properties are:
 *                            int   ecmaVersion The ECMAScript version to parse. Must be either 3, 5, 6 or 7. Default is 6.
 *                            int   indent      The indentation step to use in the output code. Default is 2.
 *                            bool  outputAst   Whether to output just the Abstract Syntax Tree. Default is false.
 */
function prettify(code, options) {
  const acornOptions = {};
  const outputOptions = {};

  // Set all possible options
  const ecmaVersion = options.ecmaVersion ? options.ecmaVersion : 6;
  const indent = options.indent && typeof options.indent == 'number' ? options.indent : 4;

  // Construct acorn & escodegen options.
  acornOptions.ecmaVersion = ecmaVersion;
  outputOptions.format = {
    indent: {
      style: Array(indent + 1).join(' ')
    }
  };

  const ast = prettifyAst(acorn.parse(code, acornOptions));

  if (options.outputAst) {
    return ast;
  }

  let result = escodegen.generate(ast, outputOptions);

  return result;
}

module.exports = {
  prettify: prettify,
  deobfuscate: prettify,
  prettifyAst: prettifyAst,
  deobfuscateAst: prettifyAst
};