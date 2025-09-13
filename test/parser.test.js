import { Parser } from "../src/parser.js"
import * as Nodes from "../src/astnodes.js"

describe("Parser", () => {
    it('should create valid AST from a polynomial', () => {
        const parser = new Parser();
        const text = "x^2-(3*x+4/5)";
        new Nodes.BinOpNode(
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
                    new Nodes.VariableNode("x")
                ),
                Nodes.OperationType.PLUS,
                new Nodes.BinOpNode(
                    new Nodes.NumberNode(4),
                    Nodes.OperationType.DIVIDE,
                    new Nodes.NumberNode(5)
                )
            )
        );
        expect(parser.parse(text)).toEqual(result);
    });
    it('should throw ParserError at ill-formed mathematical expression', () => {
        const parser = new Parser();
        const text = "x^2 - * (3*x+4/5)";
        expect(parser.parse(text)).toThrow(expect.objectContaining({
            name: "ParserError",
            message: expect.stringMatching("Expected .*?, but received *"),
            col: 6
        }))
    })
});
