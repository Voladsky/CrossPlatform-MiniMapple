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
        const needsPars = currentPrecedence < args[0];
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
        return new BinOpNode(left_result, node.operator, right_result);
    }
    visitNumberNode(node) {
        return node;
    }
    visitVariableNode(node) {
        return node;
    }
}
