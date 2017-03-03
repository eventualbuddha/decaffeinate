import check from './support/check';

describe('functions', () => {
  it('handles functions without a body', () => {
    check(`->`, `(function() {});`);
  });

  it('put the closing curly brace on a new line', () => {
    check(`
      ->
        0
        return 0
    `, `
      (function() {
        0;
        return 0;
      });
    `);
  });

  it('put the closing curly brace on the same line if the original is a single line', () => {
    check(`
      -> 0; return 0
    `, `
      (function() { 0; return 0; });
    `);
  });

  it('puts the closing curly brace before any trailing comments on the last statement in the body', () => {
    check(`
      ->
        0
        return 0 # hey
      b
    `, `
      (function() {
        0;
        return 0; // hey
      });
      b;
    `);
  });

  it('puts the closing punctuation before trailing comments for one-line functions', () => {
    check(`
      -> 0; return 0 # b
    `, `
      (function() { 0; return 0; }); // b
    `);
  });

  it('puts the closing punctuation before trailing comments for parentheses-wrapped functions', () => {
    check(`
      (->
        0
        return 0) # b
    `, `
      (function() {
        0;
        return 0;}); // b
    `);
  });

  it('puts the closing punctuation after trailing comments for multi-line bodies', () => {
    check(`
      validExpirationDate = (month, year) ->
        today = new Date()
        fullYear = 2000 + parseInt(year)
        (/^\\d{1,2}$/.test month) and (/^\\d{1,2}$/.test year) and
          (month >= 1 and month <= 12) and
          fullYear >= today.getFullYear() and
          (fullYear isnt today.getFullYear() or month > today.getMonth()) # Date.month is 0 indexed

      module.exports = { validExpirationDate }
    `, `
      let validExpirationDate = function(month, year) {
        let today = new Date();
        let fullYear = 2000 + parseInt(year);
        return (/^\\d{1,2}$/.test(month)) && (/^\\d{1,2}$/.test(year)) &&
          ((month >= 1) && (month <= 12)) &&
          (fullYear >= today.getFullYear()) &&
          ((fullYear !== today.getFullYear()) || (month > today.getMonth())); // Date.month is 0 indexed
      };

      export { validExpirationDate };
    `);
  });

  it('puts closing curly brace just inside loosely-wrapped function parens', () => {
    check(`
      (->
        @get('delegateEmail') or @get('email')
      ).property('delegateEmail', 'email')
    `, `
      (function() {
        return this.get('delegateEmail') || this.get('email');
      }).property('delegateEmail', 'email');
    `);
  });

  it('handles fat arrow functions without a body', () => {
    check(`=>`, `() => {};`);
  });

  it('leaves fat arrow functions as arrow functions', () => {
    check(`add = (a, b) => a + b`, `let add = (a, b) => a + b;`);
  });

  it('adds a block to fat arrow functions if their body is a block', () => {
    check(`
      add = (a, b) =>
        a + b
    `, `
      let add = (a, b) => {
        return a + b;
      };
    `);
  });

  it('wraps the body of fat arrow functions if the body is a sequence', () => {
    check(`=> a; b`, `() => (a, b);`);
  });

  it('unwraps single-parameter fat arrow functions', () => {
    check(`(a) => a`, `a => a;`);
  });

  it('turns fat arrow functions referencing `arguments` into regular functions with a `bind` call', () => {
    check(`
      => arguments[0]
    `, `
      (function() { return arguments[0]; }.bind(this));
    `);
  });

  it('handles a nested conditional in a fat arrow function referencing arguments', () => {
    check(`
      a =>
        if b
          c arguments
    `, `
      a(function() {
        if (b) {
          return c(arguments);
        }
      }.bind(this));
    `);
  });

  it('turns expression-style fat arrow functions referencing `arguments` into regular functions with a `bind` call', () => {
    check(`
      x = => arguments[0] + this
    `, `
      let x = function() { return arguments[0] + this; }.bind(this);
    `);
  });

  it('turns fat arrow object methods referencing `arguments` into regular functions with a `bind` call', () => {
    check(`
      {
        x: => arguments[0] + this
      }
    `, `
      ({
        x: function() { return arguments[0] + this; }.bind(this)
      });
    `);
  });

  it('turns fat arrow class methods referencing `arguments` into methods bound in the constructor', () => {
    check(`
      class A
        x: => arguments[0] + this
    `, `
      class A {
        constructor() {
          this.x = this.x.bind(this);
        }
      
        x() { return arguments[0] + this; }
      }
    `);
  });

  it('turns functions containing a `yield` statement into generator functions', () => {
    check(`
      -> yield fn()
    `, `
      (function*() { return yield fn(); });
    `);
  });

  it('turns functions containing a `yield from` statement into generator functions', () => {
    check(`
      -> yield from fn()
    `, `
      (function*() { return yield* fn(); });
    `);
  });

  it('wraps parens around yield in a normal expression context', () => {
    check(`
      -> 1 + yield 2
    `, `
      (function*() { return 1 + (yield 2); });
    `);
  });

  it('wraps parens around yield* in a normal expression context', () => {
    check(`
      -> 1 + yield from 2
    `, `
      (function*() { return 1 + (yield* 2); });
    `);
  });

  it('does not wrap parens around yield in an assignment', () => {
    check(`
      ->
        x = yield 2
        return x
    `, `
      (function*() {
        let x = yield 2;
        return x;
      });
    `);
  });

  it('does not wrap parens around yield* in an assignment', () => {
    check(`
      ->
        x = yield from 2
        return x
    `, `
      (function*() {
        let x = yield* 2;
        return x;
      });
    `);
  });

  it('does not wrap parens around yield in an explicit return', () => {
    check(`
      ->
        return yield 2
    `, `
      (function*() {
        return yield 2;
      });
    `);
  });

  it('does not wrap parens around yield* in an explicit return', () => {
    check(`
      ->
        return yield from 2
    `, `
      (function*() {
        return yield* 2;
      });
    `);
  });

  it('turns fat arrow function containing a `yield` statement into a generator function with bind', () => {
    check(`
      => yield fn()
    `, `
      (function*() { return yield fn(); }.bind(this));
    `);
  });

  it('correctly handles fat arrow object function values containing yield ', () => {
    check(`
      {
        x: =>
          yield fn()
      }
    `, `
      ({
        x: function*() {
          return yield fn();
        }.bind(this)
      });
    `);
  });

  it('correctly handles fat arrow class methods containing yield', () => {
    check(`
      class C
        x: =>
          yield fn()
    `, `
      class C {
        constructor() {
          this.x = this.x.bind(this);
        }
      
        *x() {
          return yield fn();
        }
      }
    `);
  });

  it('correctly handles `yield return` with an expression', () => {
    check(`
      ->
        yield return 3
    `, `
      (function*() {
        return 3;
      });
    `);
  });

  it('correctly handles `yield return` without an expression', () => {
    check(`
      ->
        yield return
    `, `
      (function*() {
      });
    `);
  });

  it('keeps function with a spread in braces', () => {
    check(`(args...) =>`, `(...args) => {};`);
  });

  it('keeps function with a single assignment as a parameter in braces in loose param mode', () => {
    check(`(args=false) =>`, `(args=false) => {};`, { looseDefaultParams: true });
  });

  it('places the function end in the right place when ending in an implicit function call', () =>
    check(`
      A = {
        b: ->
          return c d,
            e,
              f
      }
      G
    `, `
      const A = {
        b() {
          return c(d,
            e,
              f);
        }
      };
      G;
    `)
  );

  it('puts parens around an arrow function returning a single-element object', () =>
    check(`
      => {a: b}
    `, `
      () => ({a: b});
    `)
  );

  it('puts parens around an arrow function returning a multi-element object', () =>
    check(`
      => {a: b, c: d}
    `, `
      () => ({a: b, c: d});
    `)
  );

  it('properly closes a function as the only argument to a function', () =>
    check(`
      it ->
        a
        return
    `, `
      it(function() {
        a;
      });
    `)
  );

  it('properly closes a function as the second argument to a function', () =>
    check(`
      it a, ->
        b
        return
    `, `
      it(a, function() {
        b;
      });
    `)
  );

  it('handles functions that omit commas in the parameter list', () =>
    check(`
      (foo
      bar) ->
        return baz
    `, `
      (foo,
      bar) => baz;
    `)
  );

  it('handles a this-assign parameter with a reserved word name', () =>
    check(`
      (@case) ->
    `, `
      (function(case1) {
        this.case = case1;
      });
    `)
  );

  it('allows semicolon delimiters between parameters', () =>
    check(`
      (a, b; c, d;) ->
    `, `
      (function(a, b, c, d) {});
    `)
  );

  it('handles a complex fat arrow function body starting with an open-brace', () =>
    check(`
      x => {a: 'b'}['a']
    `, `
      x(() => ({a: 'b'}['a']));
    `)
  );

  it('handles a fat arrow function with an implicit object body', () =>
    check(`
      x => a: b
    `, `
      x(() => ({a: b}));
    `)
  );
});
