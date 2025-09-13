import { BinOpNode, DiffNode, NumberNode, OperationType, PRECEDENCE } from "./astnodes";

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
            if (node instanceof BinOpNode) {
                diffNode._canPropagate = true;
            }
            return diffNode;
        }
        super.visit(node, ...args);
    }
    visitBinOpNode(node, ...args) {
        if (!node._canPropagate) return node;
        const depth = args[0];
        const left_result = this.visit(node.left, depth - 1);
        const right_result = this.visit(node.left, depth - 1);
        let result = null;
        switch (node.operator) {
            case OperationType.ADD:
                result = new BinOpNode(this.visit(node.left, depth - 1), OperationType.ADD, this.visit(node.right, depth - 1))
                break;
            case OperationType.SUBTRACT:
                result = new BinOpNode(this.visit(node.left, depth - 1), OperationType.SUBTRACT, this.visit(node.right, depth - 1))
                break;
            case OperationType.MULTIPLY:
                result = new BinOpNode(
                    new BinOpNode(
                        this.visit(node.left, depth - 1),
                        OperationType.MULTIPLY,
                        node.right
                    ),
                    BinOpNode(
                        node.left,
                        OperationType.MULTIPLY,
                        this.visit(node.right, depth - 1)
                    )
                )
                break;
            case OperationType.DIVIDE:
                result = new BinOpNode(
                    new BinOpNode(
                        new BinOpNode(
                            this.visit(node.left, depth - 1),
                            OperationType.MULTIPLY,
                            node.right
                        ),
                        OperationType.SUBTRACT,
                        BinOpNode(
                            node.left,
                            OperationType.MULTIPLY,
                            this.visit(node.right, depth - 1)
                        )
                    ),
                    OperationType.DIVIDE,
                    new BinOpNode(
                        right,
                        OperationType.POWER,
                        new NumberNode(2)
                    )
                )
                break;
            default:
                throw new Error(`Unknown operator '${node.operator}'`);
        }
        result._canPropagate = left_result._canPropagate || right_result._canPropagate;
    }
    visitVariableNode(node) {
        return new DiffNode(node);
    }
    visitNumberNode(node) {
        return new DiffNode(node);
    }
    canPropagate(node) {
        return node._canPropagate;
    }
}
