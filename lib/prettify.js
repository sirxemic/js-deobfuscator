"use strict";

const acornWalk = require('acorn/dist/walk');

/**
 *  Wrap one or more nodes with a block statement.
 *
 *  This function leaves block statement nodes alone.
 */
function makeBlockStatement(node) {
  if (node.type == 'BlockStatement') {
    return node;
  }

  const nodes = node instanceof Array ? node : [node];
  return prettify({
    type: 'BlockStatement',
    body: nodes
  });
}

function findNode(node, test) {
  if (!node) {
    return false;
  }

  return acornWalk.findNodeAt(node, null, null, test);
}

/**
 *  Functions that transform statement-level expressions into pretty statements.
 */
const looseExpressionPrettifiers = {

  SequenceExpression: function(node) {
    return node.expressions;
  },

  ConditionalExpression: function(node) {
    let consequent = prettifyIfLoose(node.consequent, true),
        alternate = prettifyIfLoose(node.alternate, true);

    if (consequent.type == 'IfStatement') {
      consequent = makeBlockStatement(consequent);
    }

    if (alternate.type != 'IfStatement' || !alternate.alternate) {
      alternate = makeBlockStatement(alternate);
    }

    const result = prettify({
      type: 'IfStatement',
      test: node.test,
      consequent: consequent,
      alternate: alternate
    });
    return result;
  },

  LogicalExpression: function(node) {
    const consequent = prettifyIfLoose(node.right, true);

    if (node.operator == '&&') {
      const result = prettify({
        type: 'IfStatement',
        test: node.left,
        consequent: consequent,
        alternate: null
      });
      return result;
    }
    else {
      const test = {
        type: 'UnaryExpression',
        operator: '!',
        argument: node.left
      };

      const result = prettify({
        type: 'IfStatement',
        test: test,
        consequent: consequent,
        alternate: null
      });
      return result;
    }
  },

  AssignmentExpression: function(node) {
    return {
      type: 'ExpressionStatement',
      expression: node
    };
  },

  CallExpression: function(node) {
    return {
      type: 'ExpressionStatement',
      expression: node
    };
  }

};

const prettifiers = {

  ExpressionStatement: function(node) {
    return prettifyIfLoose(node.expression);
  },

  IfStatement: function(node) {
    if (node.test.type == 'SequenceExpression') {
      const result = [],
          expressions = node.test.expressions;

      for (let i = 0; i < expressions.length - 1; i++) {
        result.push(expressions[i]);
      }

      result.push(prettify({
        type: 'IfStatement',
        test: expressions[expressions.length - 1],
        consequent: node.consequent,
        alternate: node.alternate
      }, true));

      return result;
    }

    const result = Object.assign({}, node);

    ['consequence', 'alternate'].forEach(function(clause) {
      if (!node[clause]) return;

      result[clause] = prettifyIfLoose(node[clause], true);
    })

    return result;
  },

  SwitchStatement: function(node) {
    if (node.discriminant.type == 'SequenceExpression') {
      const result = [],
          expressions = node.discriminant.expressions;

      for (let i = 0; i < expressions.length - 1; i++) {
        result.push(expressions[i]);
      }

      result.push({
        type: 'SwitchStatement',
        discriminant: expressions[expressions.length - 1],
        cases: node.cases
      });

      return result;
    }

    return node;
  },

  ForStatement: function(node) {
    if (node.init) {

      // Try to keep the for-loop init code minimal and take variable declarations outside.
      if (node.init.type == 'VariableDeclaration' && node.init.kind == 'var') {
        const result = [],
            variableDeclarations = node.init.declarations;

        let outsideDeclarations = [], newDeclarations = [];

        variableDeclarations.forEach(function(declaration) {
          const identifier = declaration.id.name;

          function test(type, node) {
            return node && type == 'Identifier' && node.name == identifier;
          }

          // If the identifier is found in the test or update code, it makes sense to leave it in the
          // init code.
          if (!identifier || findNode(node.test, test) || findNode(node.update, test)) {
            newDeclarations.push(declaration);
          }
          else {
            outsideDeclarations.push(declaration);
          }
        });

        if (outsideDeclarations.length > 0) {
          result.push({
            type: 'VariableDeclaration',
            declarations: outsideDeclarations,
            kind: node.init.kind
          });
        }

        let newInit;
        if (newDeclarations.length > 0) {
          newInit = {
            type: 'VariableDeclaration',
            declarations: newDeclarations,
            kind: node.init.kind
          };
        }
        else {
          newInit = null;
        }

        result.push({
          type: 'ForStatement',
          init: newInit,
          test: node.test,
          update: node.update,
          body: node.body
        });

        return result;
      }
      else if (node.init.type == 'SequenceExpression') {
        const result = [],
            expressions = node.init.expressions;

        for (let i = 0; i < expressions.length - 1; i++) {
          result.push(expressions[i]);
        }

        result.push({
          type: 'ForStatement',
          init: expressions[expressions.length - 1],
          test: node.test,
          update: node.update,
          body: node.body
        });

        return result;
      }
    }

    return node;
  },

  Program: function(node) {
    const result = Object.assign({}, node);
    result.body = [];

    node.body.forEach(function(node) {
      const subresult = prettifyIfLoose(node);
      if (subresult instanceof Array) {
        result.body = result.body.concat(subresult);
      }
      else {
        result.body.push(subresult);
      }
    });

    return result;
  },

  BlockStatement: function(node) {
    const result = Object.assign({}, node);
    result.body = [];

    node.body.forEach(function(node) {
      const subresult = prettifyIfLoose(node);
      if (subresult instanceof Array) {
        result.body = result.body.concat(subresult);
      }
      else {
        result.body.push(subresult);
      }
    });

    return result;
  },

  BinaryExpression: function(node) {
    const operatorReverse = {
      '==': '==',
      '===': '===',
      '!=': '!=',
      '!==': '!==',
      '>': '<',
      '>=': '<=',
      '<': '>',
      '<=': '>='
    };

    function shouldSwap(left, right) {
      function isIdentifier(node) {
        return node.type == 'Identifier';
      }

      function isLiteral(node) {
        return node.type == 'Literal';
      }

      // A non-modifying unary expression with a literal in it is kinda a literal
      function isUnaryLiteral(node) {
        if (isLiteral(node)) return true;
        if (node.type != 'UnaryExpression') return false;
        if (!isLiteral(node.argument)) return false;
        if (['-', '+', '!', '~', 'typeof'].indexOf(node.operator) == -1) return false;

        return true;
      }

      function isKindaLiteral(node) {
        return isLiteral(node) || isUnaryLiteral(node);
      }

      // "undefined" should be at the right
      if (isIdentifier(left) && left.name == 'undefined') {
        return true;
      }

      // If there is one identifier, it should be on the left (in general)
      if (!isIdentifier(left) && isIdentifier(right)) {
        return true;
      }

      // In general literals should be at the right
      if (isKindaLiteral(node.left) && !isKindaLiteral(node.right)) {
        return true;
      }

      return false;
    }

    if (node.operator in operatorReverse && shouldSwap(node.left, node.right)) {
      const result = Object.assign({}, node);
      result.left = node.right;
      result.right = node.left;
      result.operator = operatorReverse[node.operator];
      return result;
    }

    return node;
  },

  UnaryExpression: function(node) {
    switch (node.operator) {
      case '!':
        if (node.argument.type == 'Literal' && (node.argument.value == 1 || node.argument.value == 0)) {
          return {
            type: 'Literal',
            value: !node.argument.value
          };
        }
        break;
      case 'void':
        if (node.argument.type == 'Literal') {
          return {
            type: 'Identifier',
            name: 'undefined'
          };
        }
        break;
    }

    return node;
  },

  ReturnStatement: function(node) {
    if (node.argument && node.argument.type == 'SequenceExpression') {
      const result = []

      for (let i = 0; i < node.argument.expressions.length - 1; i++) {
        result.push(node.argument.expressions[i]);
      }

      result.push({
        type: 'ReturnStatement',
        argument: node.argument.expressions[node.argument.expressions.length - 1]
      });

      return result;
    }

    if (node.argument && node.argument.type == 'ConditionalExpression') {
      const consequent = prettify({
        type: 'ReturnStatement',
        argument: node.argument.consequent
      }, true);

      const alternate = prettify({
        type: 'ReturnStatement',
        argument: node.argument.alternate
      }, true);

      const result = prettify({
        type: 'IfStatement',
        test: node.argument.test,
        consequent: consequent,
        alternate: alternate
      });

      return result;
    }

    return node;
  }

};

/**
 *  Default prettify function that just walks the tree and prettifies all descendants.
 */
function defaultPrettify(node) {
  const result = Object.assign({}, node);

  for (let key in node) {
    if (node[key]) {
      if (node[key] instanceof Array) {
        result[key] = [];

        node[key].forEach(function(node) {
          const newNode = prettify(node);
          if (newNode instanceof Array) {
            result[key] = result[key].concat(newNode);
          }
          else {
            result[key].push(newNode);
          }
        });
      }
      else if (typeof node[key] == 'object' && node[key].type) {
        let newNode = prettify(node[key]);
        if (newNode instanceof Array) {
          newNode = makeBlockStatement(newNode);
        }

        result[key] = newNode;
      }
    }
  }
  return result;
}

function prettify(node, forceNode) {
  let result = defaultPrettify(node);

  if (result.type in prettifiers) {
    result = prettifiers[result.type](result);
  }

  if (forceNode && result instanceof Array) {
    result = makeBlockStatement(result);
  }

  return result;
}

function prettifyIfLoose(node, forceNode) {
  if (node.type in looseExpressionPrettifiers) {
    let result = looseExpressionPrettifiers[node.type](node);

    if (forceNode && result instanceof Array) {
      result = makeBlockStatement(result);
    }

    return result;
  }

  return node;
}

module.exports = prettify;