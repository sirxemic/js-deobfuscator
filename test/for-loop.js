var expect = require('chai').expect;

var util = require('./util');

var astPrettify = require('../lib/prettify');

describe('For-loop prettification', function() {

  describe('For-loop variable declarations', function() {

    it('are left in-place.', function() {
      var ast = {
        type: 'ForStatement',
        init: {
          type: 'VariableDeclaration',
          kind: 'var',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: util.Identifier('i'),
            }
          ]
        },
        test: {
          type: 'BinaryExpression',
          left: util.Identifier('i'),
          right: util.Literal(10)
        },
        update: null,
        body: null
      };

      var prettified = astPrettify(ast);

      expect(prettified[0]).to.deep.equal(ast);
    });

    it('are taken outside the for-loop.', function() {
      var ast = {
        type: 'ForStatement',
        init: {
          type: 'VariableDeclaration',
          kind: 'var',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: util.Identifier('j'),
            }
          ]
        },
        test: {
          type: 'BinaryExpression',
          left: util.Identifier('i'),
          right: util.Literal(10)
        },
        update: null,
        body: null
      };

      var prettified = astPrettify(ast);

      expect(prettified).to.deep.equal(
        [
          {
            type: 'VariableDeclaration',
            kind: 'var',
            declarations: [
              {
                type: 'VariableDeclarator',
                id: util.Identifier('j'),
              }
            ]
          },
          {
            type: 'ForStatement',
            init: null,
            test: {
              type: 'BinaryExpression',
              left: util.Identifier('i'),
              right: util.Literal(10)
            },
            update: null,
            body: null
          }
        ]
      );
    });

    it('are partially taken outside the for-loop.', function() {
      var ast = {
        type: 'ForStatement',
        init: {
          type: 'VariableDeclaration',
          kind: 'var',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: util.Identifier('i'),
            },
            {
              type: 'VariableDeclarator',
              id: util.Identifier('j'),
            },
            {
              type: 'VariableDeclarator',
              id: util.Identifier('k'),
            }
          ]
        },
        test: {
          type: 'BinaryExpression',
          left: util.Identifier('i'),
          right: util.Literal(10)
        },
        update: null,
        body: null
      };

      var prettified = astPrettify(ast);

      expect(prettified).to.deep.equal(
        [
          {
            type: 'VariableDeclaration',
            kind: 'var',
            declarations: [
              {
                type: 'VariableDeclarator',
                id: util.Identifier('j'),
              },
              {
                type: 'VariableDeclarator',
                id: util.Identifier('k'),
              }
            ]
          },
          {
            type: 'ForStatement',
            init: {
              type: 'VariableDeclaration',
              kind: 'var',
              declarations: [
                {
                  type: 'VariableDeclarator',
                  id: util.Identifier('i'),
                }
              ]
            },
            test: {
              type: 'BinaryExpression',
              left: util.Identifier('i'),
              right: util.Literal(10)
            },
            update: null,
            body: null
          }
        ]
      );
    });

  });

});