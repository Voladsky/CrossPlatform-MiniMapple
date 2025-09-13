import * as Nodes from "../src/astnodes.js"
import { PrintVisitor } from "../src/visitors.js"

describe("PrintVisitor", () => {
    it("should iterate over AST and print it into a single string", () => {
        const visitor = new PrintVisitor();
        const tree = new Nodes.BinOpNode(
            new Nodes.BinOpNode(
                new Nodes.VariableNode("x"),
                Nodes.OperationType.POWER,
                new Nodes.NumberNode(2)
            ),
            Nodes.OperationType.SUBTRACT,
            new Nodes.BinOpNode(
                new Nodes.BinOpNode(
                    new Nodes.NumberNode(3),
                    Nodes.OperationType.MULTIPLY,
                    new Nodes.BinOpNode(
                        new Nodes.VariableNode("x"),
                        Nodes.OperationType.ADD, new Nodes.NumberNode(5)
                    )
                ),
                Nodes.OperationType.ADD,
                new Nodes.BinOpNode(
                    new Nodes.NumberNode(4),
                    Nodes.OperationType.DIVIDE,
                    new Nodes.NumberNode(5)
                )
            )
        );
        expect(visitor.visit(tree)).toEqual("x^2-3*(x+5)+4/5");
    })
})

describe("DerivationVisitor", () => {
    it("should derive the expression AST by given variable name and return an AST of the derived expression", () => {
        const visitor = new DerivationVisitor();
        const expr = new Nodes.VariableNode("x");
        expect(visitor.deriveOver("x", expr)).toEqual(new Nodes.NumberNode(1));
    })
    it("should derive all operations correctly", () => {
        const visitor = new DerivationVisitor();
        const expr_add = new Nodes.BinOpNode(
            new Nodes.VariableNode("x"),
            Nodes.OperationType.ADD,
            new Nodes.BinOpNode(
                new Nodes.NumberNode(5),
                Nodes.OperationType.MULTIPLY,
                new Nodes.VariableNode("x")
            )
        );
        const expr_sub = new Nodes.BinOpNode(
            new Nodes.VariableNode("x"),
            Nodes.OperationType.ADD,
            new Nodes.BinOpNode(
                new Nodes.NumberNode(5),
                Nodes.OperationType.SUBTRACT,
                new Nodes.VariableNode("x")
            )
        );
        const expr_mult = new Nodes.BinOpNode(
            new Nodes.VariableNode("x"),
            Nodes.OperationType.MULTIPLY,
            new Nodes.BinOpNode(
                new Nodes.NumberNode(5),
                Nodes.OperationType.MULTIPLY,
                new Nodes.VariableNode("x")
            )
        );
        const expr_div = new Nodes.BinOpNode(
            new Nodes.VariableNode("x"),
            Nodes.OperationType.DIVIDE,
            new Nodes.BinOpNode(
                new Nodes.NumberNode(5),
                Nodes.OperationType.MULTIPLY,
                new Nodes.VariableNode("x")
            )
        );
        expect(visitor.visit(expr_add)).toEqual(
            new Nodes.BinOpNode(
                new Number(1),
                Nodes.OperationType.ADD,
                new Number(5)
            ))
        expect(visitor.visit(expr_sub)).toEqual(
            new Nodes.BinOpNode(
                new Number(1),
                Nodes.OperationType.SUBTRACT,
                new Number(5)
            ))
        expect(visitor.visit(expr_mult)).toEqual(
            new Nodes.BinOpNode(
                new Nodes.VariableNode("1"),
                Nodes.OperationType.MULTIPLY,
                new Nodes.BinOpNode(
                    new Nodes.NumberNode(5),
                    Nodes.OperationType.MULTIPLY,
                    new Nodes.VariableNode("x")
                ),
                Nodes.OperationType.ADD,
                new Nodes.BinOpNode(
                    new Nodes.VariableNode("x"),
                    Nodes.OperationType.MULTIPLY,
                    new Number(5)
                )
            )
        )
        expect(visitor.visit(expr_div)).toEqual(
            new Nodes.BinOpNode(
                new Nodes.VariableNode("1"),
                Nodes.OperationType.MULTIPLY,
                new Nodes.BinOpNode(
                    new Nodes.NumberNode(5),
                    Nodes.OperationType.MULTIPLY,
                    new Nodes.VariableNode("x")
                ),
                Nodes.OperationType.SUBTRACT,
                new Nodes.BinOpNode(
                    new Nodes.VariableNode("x"),
                    Nodes.OperationType.MULTIPLY,
                    new Number(5)
                )
            )
        )
    })
})
