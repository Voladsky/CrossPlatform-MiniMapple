import {Parser} from "../src/parser.js"

describe("Parser", () => {
    it('should create valid AST from a polynomial', () => {
        const parser = new Parser();
        const text = "x^2-(3*x+4/5)";
        const result = new ExpressionNode(
            new BinOpNode(
                new BinOpNode(
                    new VariableNode("x"),
                    OperationType.POWER,
                    new NumberNode(2)
                ),
                OperationType.SUBTRACT,
                new ExpressionNode(
                    new BinOpNode(
                        new BinOpNode(
                            new NumberNode(3),
                            OperationType.MULTIPLY,
                            new VariableNode("x")
                        ),
                        OperationType.PLUS,
                        new BinOpNode(
                            new NumberNode(4),
                            OperationType.DIVIDE,
                            new NumberNode(5)
                        )
                    )
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
