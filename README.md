# js-deobfuscator
A Javascript deobfuscator written in Javascript. 

So you got a bunch of Javascript beautifiers and deminifiers here and there, but most of them only insert or remove whitespace to make it a bit more readable. This package goes one step further and actually rewrites some common minification tricks to a more readable variant.

Minified code often contains pieces of code like `if(a+=5,b=foo(),c=bar(),b < c ? n() : m(), b) { ... }`. This package transforms that example into the following:

    a += 5;
    b = foo();
    c = bar();
    if (b < c) {
      n();
    } else {
      m();
    }
    if (b) {
      ...
    }

