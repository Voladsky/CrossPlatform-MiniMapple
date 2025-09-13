import { PRECEDENCE } from "./astnodes";

class BaseVisitor {
    visit(node, ...args) { return node.accept(this, ...args); }
    visitBinOpNode(node) { throw new Error("No rule for visiting BinOpNode") }
    visitVariableNode(node) { throw new Error("No rule for visiting VariableNode") }
    visitNumberNode(node) { throw new Error("No rule for visiting NumberNode") }
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
}

export class DerivationVisitor extends BaseVisitor {
    // TODO: make the derivations (finally)
}
