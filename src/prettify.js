"use strict";

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
        consequent: consequent
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
        consequent: consequent
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