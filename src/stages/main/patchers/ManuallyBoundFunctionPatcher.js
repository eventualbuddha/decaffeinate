import FunctionPatcher from './FunctionPatcher';
import NewOpPatcher from './NewOpPatcher';

/**
 * Handles bound functions that cannot become arrow functions.
 */
export default class ManuallyBoundFunctionPatcher extends FunctionPatcher {
  patchAsStatement(options={}) {
    this.insert(this.innerStart, '(');
    super.patchAsExpression(options);
    this.insert(this.innerEnd, '.bind(this))');
  }

  patchAsExpression(options={}) {
    let needsParens = this.parent instanceof NewOpPatcher;

    if (needsParens) {
      this.insert(this.innerStart, '(');
    }

    super.patchAsExpression(options);
    // If we're instructed to patch as a method, then it won't be legal to add
    // `.bind(this)`, so skip that step. Calling code is expected to bind us
    // some other way. In practice, this happens when patching class methods;
    // code will be added to the constructor to bind the method properly.
    if (!options.method) {
      this.insert(this.innerEnd, '.bind(this)');
    }

    if (needsParens) {
      this.insert(this.innerEnd, ')');
    }
  }

  expectedArrowType(): string {
    return '=>';
  }
}
