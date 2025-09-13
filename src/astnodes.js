class ASTNode {
    constructor() {
        if (this.constructor.name === "ASTNode") {
            throw new Error("Trying to create abstract export class ASTNode");
        }
    }
    accept(v) {
        return eval(`v.visit${this.constructor.name}`);
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
    static #_ADD        = "ADD";
    static #_SUBTRACT   = "SUBTRACT";
    static #_MULTIPLY   = "MULTIPLY"
    static #_DIVIDE     = "DIVIDE";
    static #_POWER      = "POWER";

    static get ADD() { return this.#_ADD}
    static get SUBTRACT() { return this.#_SUBTRACT}
    static get MULTIPLY() { return this.#_MULTIPLY}
    static get DIVIDE() { return this.#_DIVIDE}
    static get POWER() { return this.#_POWER}
}


