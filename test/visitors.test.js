import * as Nodes from "../src/astnodes.js"
import { PrintVisitor, DerivationVisitor, EvaluationVisitor, DistributionVisitor, GrouperVisitor, TermDecomposer } from "../src/visitors.js"

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
        expect(visitor.visit(tree)).toEqual("x^2-(3*(x+5)+4/5)");
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
            ),
            Nodes.OperationType.DIVIDE,
            new Nodes.BinOpNode(
                new Nodes.VariableNode("y"),
                Nodes.OperationType.POWER,
                new Nodes.NumberNode(2)
            )
        );
        expect(result).toEqual(expected);
    })
})

describe("EvaluationVisitor", () => {
    it("should evaluate fully propagated diffnodes", () => {
        const visitor = new EvaluationVisitor();
        const tree = new Nodes.DiffNode(new Nodes.VariableNode("x"))
        const tree_numeric = new Nodes.DiffNode(new Nodes.NumberNode(3));
        const tree_another_literal = new Nodes.DiffNode(new Nodes.VariableNode("y"));
        expect(visitor.visit(tree, "x")).toEqual(new Nodes.NumberNode(1));
        expect(visitor.visit(tree_numeric, "x")).toEqual(new Nodes.NumberNode(0));
        expect(visitor.visit(tree_another_literal, "x")).toEqual(new Nodes.NumberNode(0));
    })
    it("should throw an error when encountering not fully propagated node", () => {
        const visitor = new EvaluationVisitor();
        const tree = new Nodes.DiffNode(
            new Nodes.BinOpNode(
                new Nodes.VariableNode("x"),
                Nodes.OperationType.ADD,
                new Nodes.VariableNode("y")
            )
        )
        expect(() => visitor.visit(tree)).toThrow();
    })
    it("should perform calculations on binops which are both numerical", () => {
        const visitor = new EvaluationVisitor();
        const add = new Nodes.BinOpNode(
            new Nodes.NumberNode(38), Nodes.OperationType.ADD, new Nodes.NumberNode(4));
        const sub = new Nodes.BinOpNode(
            new Nodes.NumberNode(45), Nodes.OperationType.SUBTRACT, new Nodes.NumberNode(3));
        const mul = new Nodes.BinOpNode(
            new Nodes.NumberNode(6), Nodes.OperationType.MULTIPLY, new Nodes.NumberNode(7));
        const div = new Nodes.BinOpNode(
            new Nodes.NumberNode(126), Nodes.OperationType.DIVIDE, new Nodes.NumberNode(3)
        )
        expect(visitor.visit(add)).toEqual(new Nodes.NumberNode(42));
        expect(visitor.visit(sub)).toEqual(new Nodes.NumberNode(42));
        expect(visitor.visit(mul)).toEqual(new Nodes.NumberNode(42));
        expect(visitor.visit(div)).toEqual(new Nodes.NumberNode(42));
    })
    it("should evaluate power of 1", () => {
        const visitor = new EvaluationVisitor();
        const tree = new Nodes.BinOpNode(new Nodes.VariableNode("x"), Nodes.OperationType.POWER, new Nodes.NumberNode(1));
        expect(visitor.visit(tree)).toEqual(new Nodes.VariableNode("x"));
    })
    it("should evaluate power of 0", () => {
        const visitor = new EvaluationVisitor();
        const tree = new Nodes.BinOpNode(new Nodes.VariableNode("x"), Nodes.OperationType.POWER, new Nodes.NumberNode(0));
        expect(visitor.visit(tree)).toEqual(new Nodes.NumberNode(1));
    })
    it("should evaluate multiply by 1 right-side", () => {
        const visitor = new EvaluationVisitor();
        const tree = new Nodes.BinOpNode(new Nodes.VariableNode("x"), Nodes.OperationType.MULTIPLY, new Nodes.NumberNode(1));
        expect(visitor.visit(tree)).toEqual(new Nodes.VariableNode("x"));
    })
    it("should evaluate multiply by 1 left-side", () => {
        const visitor = new EvaluationVisitor();
        const tree = new Nodes.BinOpNode(new Nodes.NumberNode(1), Nodes.OperationType.MULTIPLY, new Nodes.VariableNode("x"));
        expect(visitor.visit(tree)).toEqual(new Nodes.VariableNode("x"));
    })
    it("should evaluate multiply by 0 right-side", () => {
        const visitor = new EvaluationVisitor();
        const tree = new Nodes.BinOpNode(new Nodes.VariableNode("x"), Nodes.OperationType.MULTIPLY, new Nodes.NumberNode(0));
        expect(visitor.visit(tree)).toEqual(new Nodes.NumberNode(0));
    })
    it("should evaluate multiply by 0 left-side", () => {
        const visitor = new EvaluationVisitor();
        const tree = new Nodes.BinOpNode(new Nodes.NumberNode(0), Nodes.OperationType.MULTIPLY, new Nodes.VariableNode("x"));
        expect(visitor.visit(tree)).toEqual(new Nodes.NumberNode(0));
    })
})

describe("DistributionVisitor", () => {
    let optimizer;
    let printer;

    beforeEach(() => {
        optimizer = new DistributionVisitor();
        printer = new PrintVisitor();
    })
    describe("Addition", () => {
        it('should distribute multiplication over addition on the right side', () => {
            // a * (b + c)
            const tree = new Nodes.BinOpNode(
                new Nodes.VariableNode('a'),
                Nodes.OperationType.MULTIPLY,
                new Nodes.BinOpNode(
                    new Nodes.VariableNode('b'),
                    Nodes.OperationType.ADD,
                    new Nodes.VariableNode('c')
                )
            );

            const optimized = optimizer.visit(tree);
            const result = printer.visit(optimized, 0);

            // Should become: a*b + a*c
            expect(result).toBe('a*b+a*c');
        });
        it('should distribute multiplication over addition on the left side', () => {
            // (b + c) * a
            const tree = new Nodes.BinOpNode(
                new Nodes.BinOpNode(
                    new Nodes.VariableNode('b'),
                    Nodes.OperationType.ADD,
                    new Nodes.VariableNode('c')
                ),
                Nodes.OperationType.MULTIPLY,
                new Nodes.VariableNode('a')
            );

            const optimized = optimizer.visit(tree);
            const result = printer.visit(optimized, 0);

            // Should become: b*a + c*a
            expect(result).toBe('b*a+c*a');
        });

        it('should distribute multiplication over addition on both sides', () => {
            // (a + b) * (c + d)
            const tree = new Nodes.BinOpNode(
                new Nodes.BinOpNode(
                    new Nodes.VariableNode('a'),
                    Nodes.OperationType.ADD,
                    new Nodes.VariableNode('b')
                ),
                Nodes.OperationType.MULTIPLY,
                new Nodes.BinOpNode(
                    new Nodes.VariableNode('c'),
                    Nodes.OperationType.ADD,
                    new Nodes.VariableNode('d')
                )
            );

            const optimized = optimizer.visit(tree);
            const result = printer.visit(optimized, 0);

            // Should become: a*c + a*d + b*c + b*d
            expect(result).toBe('(a*c+a*d)+(b*c+b*d)');
        });
        it('should handle nested distributions', () => {
            // a * (b + (c + d))
            const tree = new Nodes.BinOpNode(
                new Nodes.VariableNode('a'),
                Nodes.OperationType.MULTIPLY,
                new Nodes.BinOpNode(
                    new Nodes.VariableNode('b'),
                    Nodes.OperationType.ADD,
                    new Nodes.BinOpNode(
                        new Nodes.VariableNode('c'),
                        Nodes.OperationType.ADD,
                        new Nodes.VariableNode('d')
                    )
                )
            );


            const optimized = optimizer.visit(tree);
            const result = printer.visit(optimized, 0);

            // Should become: a*b + a*c + a*d
            expect(result).toBe('a*b+(a*c+a*d)');
        });
    })
    describe("Subtraction", () => {
        it('should distribute multiplication over subtraction', () => {
            // a * (b - c)
            const tree = new Nodes.BinOpNode(
                new Nodes.VariableNode('a'),
                Nodes.OperationType.MULTIPLY,
                new Nodes.BinOpNode(
                    new Nodes.VariableNode('b'),
                    Nodes.OperationType.SUBTRACT,
                    new Nodes.VariableNode('c')
                )
            );

            const optimized = optimizer.visit(tree);
            const result = printer.visit(optimized, 0);

            // Should become: a*b - a*c
            expect(result).toBe('a*b-a*c');
        });

        it('should distribute multiplication over subtraction on the left side', () => {
            // (b - c) * a
            const tree = new Nodes.BinOpNode(
                new Nodes.BinOpNode(
                    new Nodes.VariableNode('b'),
                    Nodes.OperationType.SUBTRACT,
                    new Nodes.VariableNode('c')
                ),
                Nodes.OperationType.MULTIPLY,
                new Nodes.VariableNode('a')
            );

            const optimized = optimizer.visit(tree);
            const result = printer.visit(optimized, 0);

            // Should become: b*a - c*a
            expect(result).toBe('b*a-c*a');
        });

        it('should distribute multiplication over mixed addition and subtraction', () => {
            // a * (b + c - d)
            const tree = new Nodes.BinOpNode(
                new Nodes.VariableNode('a'),
                Nodes.OperationType.MULTIPLY,
                new Nodes.BinOpNode(
                    new Nodes.BinOpNode(
                        new Nodes.VariableNode('b'),
                        Nodes.OperationType.ADD,
                        new Nodes.VariableNode('c')
                    ),
                    Nodes.OperationType.SUBTRACT,
                    new Nodes.VariableNode('d')
                )
            );

            const optimized = optimizer.visit(tree);
            const result = printer.visit(optimized, 0);

            // Should become: a*b + a*c - a*d
            expect(result).toBe('(a*b+a*c)-a*d');
        });

        it('should handle nested subtraction distributions', () => {
            // a * (b - (c - d))
            const tree = new Nodes.BinOpNode(
                new Nodes.VariableNode('a'),
                Nodes.OperationType.MULTIPLY,
                new Nodes.BinOpNode(
                    new Nodes.VariableNode('b'),
                    Nodes.OperationType.SUBTRACT,
                    new Nodes.BinOpNode(
                        new Nodes.VariableNode('c'),
                        Nodes.OperationType.SUBTRACT,
                        new Nodes.VariableNode('d')
                    )
                )
            );

            const optimized = optimizer.visit(tree);
            const result = printer.visit(optimized, 0);

            // Should become: a*b - a*c + a*d
            expect(result).toBe('a*b-(a*c-a*d)');
        });
    })
})

describe("TermDecomposerVisitor", () => {
    const decomposer = new TermDecomposer();
    const distributor = new DistributionVisitor();
    describe("Basic decomposition", () => {
        it("should decompose a number", () => {
            // 42
            const tree = new Nodes.NumberNode(42);
            expect(decomposer.visit(tree)).toEqual([{ coef: 42, vars: [], exps: {} }])
        })
        it("should decompose a variable", () => {
            // x
            const tree = new Nodes.VariableNode("x");
            expect(decomposer.visit(tree)).toEqual([{ coef: 1, vars: ["x"], exps: { x: 1 } }]);
        })
    })
    describe("Monomial decomposition", () => {
        it("should decompose a variable in a power of number", () => {
            // x^42
            const tree = new Nodes.BinOpNode(new Nodes.VariableNode("x"), Nodes.OperationType.POWER, new Nodes.NumberNode(42));
            expect(decomposer.visit(distributor.visit(tree))).toEqual([{ coef: 1, vars: ["x"], exps: { x: 42 } }])
        })
        it("should decompose monomial with a single variable", () => {
            // 42 * x ^ 42
            const tree = new Nodes.BinOpNode(
                new Nodes.NumberNode(42), Nodes.OperationType.MULTIPLY, new Nodes.BinOpNode(new Nodes.VariableNode("x"),
                    Nodes.OperationType.POWER,
                    new Nodes.NumberNode(42)
                ));
            expect(decomposer.visit(distributor.visit(tree))).toEqual([{ coef: 42, vars: ["x"], exps: { x: 42 } }])
        })
        it("should decompose monomial with multiple variables", () => {
            // 42 * x ^ 2 * y ^ 2
            const tree = new Nodes.BinOpNode(
                new Nodes.BinOpNode(
                    new Nodes.NumberNode(42),
                    Nodes.OperationType.MULTIPLY,
                    new Nodes.BinOpNode(
                        new Nodes.VariableNode('x'),
                        Nodes.OperationType.POWER,
                        new Nodes.NumberNode(2)
                    )
                ),
                Nodes.OperationType.MULTIPLY,
                new Nodes.BinOpNode(
                    new Nodes.VariableNode('y'),
                    Nodes.OperationType.POWER,
                    new Nodes.NumberNode(2)
                )
            );
            expect(decomposer.visit(distributor.visit(tree))).toEqual([{ coef: 42, vars: ['x', 'y'], exps: { x: 2, y: 2 } }]);
        })
    })
    describe("Polynomial decomposition", () => {
        it("should decompose AST into a list of terms", () => {
            // x^3 + 5*x^2 + 3*x*y + 5
            const tree = new Nodes.BinOpNode(
                new Nodes.BinOpNode(
                    new Nodes.VariableNode('x'),
                    Nodes.OperationType.POWER,
                    new Nodes.NumberNode(3)
                ),
                Nodes.OperationType.ADD,
                new Nodes.BinOpNode(
                    new Nodes.BinOpNode(
                        new Nodes.NumberNode(5),
                        Nodes.OperationType.MULTIPLY,
                        new Nodes.BinOpNode(
                            new Nodes.VariableNode('x'),
                            Nodes.OperationType.POWER,
                            new Nodes.NumberNode(2)
                        )
                    ),
                    Nodes.OperationType.ADD,
                    new Nodes.BinOpNode(
                        new Nodes.BinOpNode(
                            new Nodes.NumberNode(3),
                            Nodes.OperationType.MULTIPLY,
                            new Nodes.BinOpNode(
                                new Nodes.VariableNode('x'),
                                Nodes.OperationType.MULTIPLY,
                                new Nodes.VariableNode('y')
                            )
                        ),
                        Nodes.OperationType.ADD,
                        new Nodes.NumberNode(5)
                    )
                )
            );

            const terms = decomposer.visit(distributor.visit(tree));

            expect(terms).toEqual([
                {
                    coef: 1,
                    vars: ['x'],
                    exps: { x: 3 }
                },
                {
                    coef: 5,
                    vars: ['x'],
                    exps: { x: 2 }
                },
                {
                    coef: 3,
                    vars: ['x', 'y'],
                    exps: { x: 1, y: 1 }
                },
                {
                    coef: 5,
                    vars: [],
                    exps: {}
                }
            ]);
        });
    })
    describe("Power decomposition", () => {
        it("should decompose frac into a term with large var", () => {
            const tree = new Nodes.BinOpNode(
                new Nodes.BinOpNode(new Nodes.VariableNode("x"), Nodes.OperationType.ADD, new Nodes.NumberNode(5)),
                Nodes.OperationType.POWER,
                new Nodes.NumberNode(-1)
            )
            const left = [
                {coef: 1, vars: ["x"], exps: {x: 1}},
                {coef: 5, vars: [], exps: {}},
            ];
            expect(decomposer.visit(tree)).toEqual([{ coef: 1, vars: [JSON.stringify(left)], exps: { [JSON.stringify(left)]: -1} }])
        })
    })
})
