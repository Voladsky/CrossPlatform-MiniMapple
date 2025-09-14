import * as Nodes from "../src/astnodes";
import { TermGrouper, TermConverter } from "../src/terms";

describe('TermGrouper', () => {
    let grouper = new TermGrouper();
    it('should group simple like terms', () => {
        // 2x + 3x = 5x
        const mockTerms = [
            { coef: 2, vars: ['x'], exps: { x: 1 } },
            { coef: 3, vars: ['x'], exps: { x: 1 } }
        ];

        const result = grouper.group(mockTerms);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ coef: 5, vars: ['x'], exps: { x: 1 } });
    });

    it('should handle different variables separately', () => {
        // 2x + 3y
        const mockTerms = [
            { coef: 2, vars: ['x'], exps: { x: 1 } },
            { coef: 3, vars: ['y'], exps: { y: 1 } }
        ];

        const result = grouper.group(mockTerms);

        expect(result).toHaveLength(2);
        expect(result).toEqual(expect.arrayContaining([
            { coef: 2, vars: ['x'], exps: { x: 1 } },
            { coef: 3, vars: ['y'], exps: { y: 1 } }
        ]));
    });
})

describe('TermConverter', () => {
    const termConverter = new TermConverter();
    it("should convert terms list to AST", () => {
        const mockTerms = [
            { coef: 2, vars: ['x'], exps: { x: 2 } },
            { coef: 3, vars: ['y'], exps: { y: 1 } }
        ];
        expect(termConverter.toAST(mockTerms)).toEqual(new Nodes.BinOpNode(
            new Nodes.BinOpNode(
                new Nodes.NumberNode(2),
                Nodes.OperationType.MULTIPLY,
                new Nodes.BinOpNode(
                    new Nodes.VariableNode("x"),
                    Nodes.OperationType.POWER,
                    new Nodes.NumberNode(2)
                ),
            ),
            Nodes.OperationType.ADD,
            new Nodes.BinOpNode(
                new Nodes.NumberNode(3),
                Nodes.OperationType.MULTIPLY,
                new Nodes.VariableNode("y")
            ),
        ))
    })
})
