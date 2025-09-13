import * as Nodes from "../src/astnodes.js"
import { PrintVisitor, DerivationVisitor } from "../src/visitors.js"

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
    it('should display derivative over expr', () => {
        const visitor = new PrintVisitor();
        const tree = new Nodes.DiffNode(new Nodes.VariableNode("x"));
        expect(visitor.visit(tree)).toEqual("x'")
    })
    it('should put always put parentheses over derivative', () => {
        const visitor = new PrintVisitor();
        const tree = new Nodes.DiffNode(new Nodes.BinOpNode(
            new Nodes.VariableNode("x"),
            Nodes.OperationType.MULTIPLY,
            new Nodes.VariableNode("y")
        ));
        expect(visitor.visit(tree)).toEqual("(x*y)'")
    })
})

describe("DerivationVisitor", () => {
    it("should perform a step of derivation by wrapping the node in DiffNode", () => {
        const visitor = new DerivationVisitor();
        const expr = new Nodes.VariableNode("x");
        expect(visitor.visit(expr, 0)).toEqual(new Nodes.DiffNode(new Nodes.VariableNode("x")));
    })
    it("should propagate the derivation into the addition according to rule", () => {
        const visitor = new DerivationVisitor();
        const expr = new Nodes.BinOpNode(
            new Nodes.VariableNode("x"),
            Nodes.OperationType.ADD,
            new Nodes.VariableNode("y")
        );
        const result = visitor.visit(expr, 1);

        const expected = new Nodes.BinOpNode(
            new Nodes.DiffNode(new Nodes.VariableNode("x")),
            Nodes.OperationType.ADD,
            new Nodes.DiffNode(new Nodes.VariableNode("y"))
        );
        expect(result).toEqual(expected);
    });
    it('should propagate the derivation into the subtraction according to rule', () => {
        const visitor = new DerivationVisitor();
        const expr = new Nodes.BinOpNode(
            new Nodes.VariableNode("x"),
            Nodes.OperationType.SUBTRACT,
            new Nodes.VariableNode("y")
        );
        const result = visitor.visit(expr, 1);

        const expected = new Nodes.BinOpNode(
            new Nodes.DiffNode(new Nodes.VariableNode("x")),
            Nodes.OperationType.SUBTRACT,
            new Nodes.DiffNode(new Nodes.VariableNode("y"))
        );
        expect(result).toEqual(expected);
    })
    it("should propagate the derivation into the multiplication according to rule", () => {
        const visitor = new DerivationVisitor();
        const expr = new Nodes.BinOpNode(
            new Nodes.VariableNode("x"),
            Nodes.OperationType.MULTIPLY,
            new Nodes.VariableNode("y")
        );
        const result = visitor.visit(expr, 1);

        const expected = new Nodes.BinOpNode(
            new Nodes.BinOpNode(
                new Nodes.DiffNode(new Nodes.VariableNode("x")),
                Nodes.OperationType.MULTIPLY,
                new Nodes.VariableNode("y")
            ),
            Nodes.OperationType.ADD,
            new Nodes.BinOpNode(
                new Nodes.VariableNode("x"),
                Nodes.OperationType.MULTIPLY,
                new Nodes.DiffNode(new Nodes.VariableNode("y"))
            )
        );
        expect(result).toEqual(expected);
    })

    it("should propagate the derivation into the division according to rule", () => {
        const visitor = new DerivationVisitor();
        const expr = new Nodes.BinOpNode(
            new Nodes.VariableNode("x"),
            Nodes.OperationType.DIVIDE,
            new Nodes.VariableNode("y")
        );
        const result = visitor.visit(expr, 1);

        const expected = new Nodes.BinOpNode(
            new Nodes.BinOpNode(
                new Nodes.BinOpNode(
                    new Nodes.DiffNode(new Nodes.VariableNode("x")),
                    Nodes.OperationType.MULTIPLY,
                    new Nodes.VariableNode("y")
                ),
                Nodes.OperationType.SUBTRACT,
                new Nodes.BinOpNode(
                    new Nodes.VariableNode("x"),
                    Nodes.OperationType.MULTIPLY,
                    new Nodes.DiffNode(new Nodes.VariableNode("y"))
                ),
                Nodes.OperationType.DIVIDE,
                new Nodes.BinOpNode(
                    new Nodes.VariableNode("y"),
                    Nodes.OperationType.POWER,
                    new Nodes.NumberNode(2)
                )
            )
        );
        expect(result).toEqual(expected);
    })
})
