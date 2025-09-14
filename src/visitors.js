import { BinOpNode, DiffNode, NumberNode, OperationType, PRECEDENCE, VariableNode } from "./astnodes";

class BaseVisitor {
    visit(node, ...args) { return node.accept(this, ...args); }
    visitBinOpNode(node) { throw new Error("No rule for visiting BinOpNode") }
    visitVariableNode(node) { throw new Error("No rule for visiting VariableNode") }
    visitNumberNode(node) { throw new Error("No rule for visiting NumberNode") }
    visitDiffNode(node) { throw new Error("No rule for visiting DiffNode") }
}

export class PrintVisitor extends BaseVisitor {
    visitBinOpNode(node, ...args) {
        const currentPrecedence = PRECEDENCE[node.operator];
        const left = this.visit(node.left, currentPrecedence);
        const right = this.visit(node.right, currentPrecedence);
        const needsPars = currentPrecedence <= args[0];
        if (needsPars) {
            return `(${left}${node.operator}${right})`;
        } else {
            return `${left}${node.operator}${right}`;
        }
    }
    visitVariableNode(node) {
        return node.name;
    }
    visitNumberNode(node) {
        return node.value.toString();
    }
    visitDiffNode(node) {
        return `${this.visit(node.deriving, 999)}'`;
    }
}

export class DerivationVisitor extends BaseVisitor {
    visit(node, ...args) {
        if (args[0] === 0) {
            const diffNode = new DiffNode(node);
            return diffNode;
        }
        return super.visit(node, ...args);
    }
    visitBinOpNode(node, ...args) {
        const depth = args[0];
        const left_result = this.visit(node.left, depth - 1);
        const right_result = this.visit(node.right, depth - 1);
        let result = null;
        switch (node.operator) {
            case OperationType.ADD:
                result = new BinOpNode(left_result, OperationType.ADD, right_result)
                break;
            case OperationType.SUBTRACT:
                result = new BinOpNode(left_result, OperationType.SUBTRACT, right_result)
                break;
            case OperationType.MULTIPLY:
                result = new BinOpNode(
                    new BinOpNode(
                        left_result,
                        OperationType.MULTIPLY,
                        node.right
                    ),
                    OperationType.ADD,
                    new BinOpNode(
                        node.left,
                        OperationType.MULTIPLY,
                        right_result
                    )
                )
                break;
            case OperationType.DIVIDE:
                result = new BinOpNode(
                    new BinOpNode(
                        new BinOpNode(
                            left_result,
                            OperationType.MULTIPLY,
                            node.right
                        ),
                        OperationType.SUBTRACT,
                        new BinOpNode(
                            node.left,
                            OperationType.MULTIPLY,
                            right_result
                        )
                    ),
                    OperationType.DIVIDE,
                    new BinOpNode(
                        node.right,
                        OperationType.POWER,
                        new NumberNode(2)
                    )
                )
                break;
            default:
                throw new Error(`Unknown operator '${node.operator}'`);
        }
        return result;
    }
    visitVariableNode(node) {
        return new DiffNode(node);
    }
    visitNumberNode(node) {
        return new DiffNode(node);
    }
}

export class EvaluationVisitor extends BaseVisitor {
    visitDiffNode(node, literal) {
        const value = this._derive(node.deriving, literal);
        return new NumberNode(value);
    }
    _derive(node, literal) {
        if (node instanceof VariableNode) {
            if (node.name === literal)
                return 1;
            else return 0;
        }
        if (node instanceof NumberNode) {
            return 0;
        }
        throw new Error("Derivation is not propagated enough")
    }
    visitBinOpNode(node, ...args) {
        const literal = args[0];
        const left_result = this.visit(node.left, ...args);
        const right_result = this.visit(node.right, ...args);
        if (left_result instanceof NumberNode && right_result instanceof NumberNode) {
            return new NumberNode(eval(`${left_result.value}${node.operator}${right_result.value}`));
        }
        if (node.operator === OperationType.POWER) {
            if (right_result instanceof NumberNode && right_result.value === 1) {
                return left_result;
            }
            if (right_result instanceof NumberNode && right_result.value === 0) {
                return new NumberNode(1);
            }
        }
        if (node.operator === OperationType.MULTIPLY) {
            if (left_result instanceof NumberNode && left_result.value === 1)
                return right_result
            if (right_result instanceof NumberNode && right_result.value === 1)
                return left_result
            if (left_result instanceof NumberNode && left_result.value === 0 ||
                right_result instanceof NumberNode && right_result.value === 0) {
                return new NumberNode(0);
            }
        }
        if (node.operator === OperationType.ADD) {
            if (left_result instanceof NumberNode && left_result.value === 0)
                return right_result
            if (right_result instanceof NumberNode && right_result.value === 0)
                return left_result
        }
        if (node.operator === OperationType.SUBTRACT) {
            if (right_result instanceof NumberNode && right_result.value === 0)
                return left_result
        }
        return new BinOpNode(left_result, node.operator, right_result);
    }
    visitNumberNode(node) {
        return node;
    }
    visitVariableNode(node) {
        return node;
    }
}

export class DistributionVisitor extends BaseVisitor {
    visitBinOpNode(node, ...args) {
        const left = this.visit(node.left);
        const right = this.visit(node.right);

        if (node.operator === OperationType.MULTIPLY) {
            return this._distributeMultiplication(left, right);
        }

        if (node.operator === OperationType.POWER && node.right.value > 0) {
            let result = node.left;
            for (let i = 0; i < node.right.value - 1; i++) {
                result = new BinOpNode(result, OperationType.MULTIPLY, node.left)
            }
            return this._distributeMultiplication(result.left, result.right);
        }

        return new BinOpNode(left, node.operator, right);
    }

    _distributeMultiplication(left, right) {
        if (this._isAddSub(left) && this._isAddSub(right)) {
            // (a + b) * (c + d) = a*c + a*d + b*c + b*d
            return new BinOpNode(
                new BinOpNode(
                    this._distributeMultiplication(left.left, right.left),
                    right.operator,
                    this._distributeMultiplication(left.left, right.right)
                ),
                left.operator,
                new BinOpNode(
                    this._distributeMultiplication(left.right, right.left),
                    right.operator,
                    this._distributeMultiplication(left.right, right.right)
                )
            );
        }
        else if (this._isAddSub(left)) {
            // (a + b) * c = a*c + b*c
            return new BinOpNode(
                this._distributeMultiplication(left.left, right),
                left.operator,
                this._distributeMultiplication(left.right, right)
            );
        }
        else if (this._isAddSub(right)) {
            // a * (b + c) = a*b + a*c
            return new BinOpNode(
                this._distributeMultiplication(left, right.left),
                right.operator,
                this._distributeMultiplication(left, right.right)
            );
        }
        return new BinOpNode(left, OperationType.MULTIPLY, right);
    }

    _isAddSub(node) {
        return node instanceof BinOpNode && (node.operator === OperationType.ADD || node.operator === OperationType.SUBTRACT);
    }

    visitVariableNode(node) {
        return node;
    }

    visitNumberNode(node) {
        return node;
    }

    visitDiffNode(node) {
        return new DiffNode(this.visit(node.deriving));
    }
}

export class GrouperVisitor extends BaseVisitor {
    visitBinOpNode(node) {
        const left = this.visit(node.left);
        const right = this.visit(node.right);
        if (node.operator === OperationType.ADD) {
            return this.groupTerms(left, right);
        }
    }
}

export class TermDecomposer extends BaseVisitor {
    visitBinOpNode(node) {
        switch (node.operator) {
            case OperationType.ADD:
                return [...this.visit(node.left), ...this.visit(node.right)]
            case OperationType.SUBTRACT:
                const left_sub = this.visit(node.left)
                const right_sub = this.visit(node.right)
                right_sub.forEach(element => {
                    element.coef = -element.coef;
                });
                return [...left_sub, ...right_sub]
            case OperationType.MULTIPLY:
                return [...this._multiplyTerms(this.visit(node.left), this.visit(node.right))]
            case OperationType.POWER:
                const left_pow = this.visit(node.left)
                return [{ coef: 1, vars: [JSON.stringify(left_pow)], exps: { [JSON.stringify(left_pow)]: node.right.value} }]
            default:
                throw new Error("Only supported operations by TermDecomposer are: ADD, SUB, MUL, POW")
        }
    }
    _multiplyTerms(leftTerms, rightTerms) {
        const result = [];

        for (const leftTerm of leftTerms) {
            for (const rightTerm of rightTerms) {
                const coef = leftTerm.coef * rightTerm.coef;
                const exps = { ...leftTerm.exps };

                // Add or merge right term exponents
                for (const [variable, exponent] of Object.entries(rightTerm.exps)) {
                    if (exps.hasOwnProperty(variable)) {
                        exps[variable] += exponent;
                    } else {
                        exps[variable] = exponent;
                    }
                }
                const vars = Object.keys(exps);
                result.push({ coef, vars, exps });
            }
        }


        return result;
    }
    visitNumberNode(node) {
        return [{ coef: node.value, vars: [], exps: {} }]
    }
    visitVariableNode(node) {
        return [{ coef: 1, vars: [node.name], exps: { [node.name]: 1 } }]
    }
}
