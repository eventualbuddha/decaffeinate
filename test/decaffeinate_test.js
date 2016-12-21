import check from './support/check';

describe('decaffeinate', () => {
  // https://github.com/decaffeinate/decaffeinate/issues/173
  it('handles programs that start or end with a space (#173)', () => {
    check(` a`, ` a;`);
    check(`\ta`, `\ta;`);
    check(`a `, `a; `);
    check(`a\t`, `a;\t`);
  });

  it('handles empty programs', () => {
    check(``, ``);
  });
});

describe('automatic conversions', () => {
  describe('inserting commas', () => {
    it('does not add commas after block comments', () => {
      check(`
        {
          a: b
          ###
          # no comma
          ###
          c: d
        }
      `, `
        ({
          a: b,
          /*
           * no comma
           */
          c: d
        });
      `
      );
    });

    describe('in objects', () => {
      it('inserts commas after properties if they are not there', () => {
        check(`
          {
            a: b
            c: d
          }
        `, `
          ({
            a: b,
            c: d
          });
        `);
      });

      it('does not insert commas if there already is one', () => {
        check(`
          {
            a: b,
            c: d
          }
        `, `
          ({
            a: b,
            c: d
          });
        `);
      });

      it('does not insert commas in single-line objects', () => {
        check(`{ a: b, c: d }`, `({ a: b, c: d });`);
      });

      it('inserts commas only for objects that end a line', () => {
        check(`
          {
            a: b, c: d
            e: f
            g: h
          }
        `, `
          ({
            a: b, c: d,
            e: f,
            g: h
          });
        `);
      });

      it('inserts commas immediately after the element if followed by a comment', () => {
        check(`
          {
            a: b # hi!
            c: d
          }
        `, `
          ({
            a: b, // hi!
            c: d
          });
        `);
      });

      it('inserts commas after shorthand properties', () => {
        check(`
          {
            a
            c
          }
        `, `
          ({
            a,
            c
          });
        `);
      });

      it('inserts commas for braceless objects', () => {
        check(`
          a: b
          c: d
        `, `
          ({
            a: b,
            c: d
          });
        `);
      });
    });
  });

  describe('converting all at once', () => {
    it('adds semicolons after call parentheses', () => {
      check(`Ember = require "ember"`, `import Ember from "ember";`);
    });

    it('adds braces to implicit object literals', () => {
      check(`a b: c`, `a({b: c});`);
    });

    it('does not add parentheses to objects that are implicit returns', () => {
      check(`
        ->
          a = 1
          {a}
      `, `
        (function() {
          let a = 1;
          return {a};
        });
      `);
    });

    it('preserves statements on one line separated by a semicolon', () => {
      check('a; b', 'a; b;');
    });

    it('handles object literals with function property values', () => {
      check(`
        a
          b: ->
            c

          d: 1
      `, `
        a({
          b() {
            return c;
          },

          d: 1
        });
      `);
    });

    it('handles object literals with function property values followed by comments', () => {
      check(`
        a
          b: ->
            c

        # FOO
        d e
      `, `
        a({
          b() {
            return c;
          }
        });

        // FOO
        d(e);
      `);
    });
  });
});
