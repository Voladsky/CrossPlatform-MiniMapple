class ASTNode {
    constructor() {
        if (this.constructor.name === "ASTNode") {
            throw new Error("Trying to create abstract export class ASTNode");
        }
    }
    accept(v, ...args) {
        return v[`visit${this.constructor.name}`](this, ...args);
    }
}

export class BinOpNode extends ASTNode {
    constructor(left, operator, right) {
        super();
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
}

export class VariableNode extends ASTNode {
    constructor(name) {
        super();
        this.name = name;
    }
}

export class NumberNode extends ASTNode {
    constructor(value) {
        super();
        this.value = value;
    }
}

export class OperationType {
    static #_ADD        = "+";
    static #_SUBTRACT   = "-";
    static #_MULTIPLY   = "*"
    static #_DIVIDE     = "/";
    static #_POWER      = "^";

    static get ADD() { return this.#_ADD}
    static get SUBTRACT() { return this.#_SUBTRACT}
    static get MULTIPLY() { return this.#_MULTIPLY}
    static get DIVIDE() { return this.#_DIVIDE}
    static get POWER() { return this.#_POWER}
}

export const PRECEDENCE = {
    [OperationType.POWER]: 4,
    [OperationType.MULTIPLY]: 3,
    [OperationType.DIVIDE]: 3,
    [OperationType.ADD]: 2,
    [OperationType.SUBTRACT]: 2
};
