module.exports = {
  Identifier: function(name) {
    return {
      type: 'Identifier',
      name: name
    };
  },
  Literal: function(value) {
    return {
      type: 'Literal',
      value: value
    };
  }
}