var expect = require('chai').expect;

var util = require('./util');

var astPrettify = require('../lib/prettify');

describe('Conditionals prettification', function() {

  describe('Ternary operator', function() {

    it('is transformed into if-statement', function() {
      var assignmentExpression1 = {
          type: 'AssignmentExpression',
          id: util.Identifier('a'),
          argument: util.Literal(10)
        };

      var assignmentExpression2 = {
          type: 'AssignmentExpression',
          id: util.Identifier('a'),
          argument: util.Literal(20)
        };

      var ast = {
        type: 'Program',
        body: [
          {
            type: 'ConditionalExpression',
            test: util.Identifier('test'),
            consequent: {
              type: 'SequenceExpression',
              expressions: [
                assignmentExpression1,
                assignmentExpression2
              ]
            },
            alternate: {
              type: 'SequenceExpression',
              expressions: [
                assignmentExpression2,
                assignmentExpression1
              ]
            }
          }
        ]
      };

      var prettified = astPrettify(ast);

      expect(prettified).to.deep.equal(
        {
          type: 'Program',
          body: [
            {
              type: 'IfStatement',
              test: util.Identifier('test'),
              consequent: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ExpressionStatement',
                    expression: assignmentExpression1
                  },
                  {
                    type: 'ExpressionStatement',
                    expression: assignmentExpression2
                  }
                ]
              },
              alternate: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ExpressionStatement',
                    expression: assignmentExpression2
                  },
                  {
                    type: 'ExpressionStatement',
                    expression: assignmentExpression1
                  }
                ]
              }
            }
          ]
        }
      );
    });

  });

  describe('Logical AND-expression', function() {

    it('is transformed into if-statement', function() {

      var assignmentExpression1 = {
          type: 'AssignmentExpression',
          id: util.Identifier('a'),
          argument: util.Literal(10)
        };

      var ast = {
        type: 'Program',
        body: [
          {
            type: 'LogicalExpression',
            operator: '&&',
            left: util.Identifier('test'),
            right: {
              type: 'SequenceExpression',
              expressions: [
                assignmentExpression1,
                assignmentExpression1
              ]
            }
          }
        ]
      };

      var prettified = astPrettify(ast);

      expect(prettified).to.deep.equal(
        {
          type: 'Program',
          body: [
            {
              type: 'IfStatement',
              test: util.Identifier('test'),
              consequent: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ExpressionStatement',
                    expression: assignmentExpression1
                  },
                  {
                    type: 'ExpressionStatement',
                    expression: assignmentExpression1
                  }
                ]
              },
              alternate: null
            }
          ]
        }
      );
    });

  })

});