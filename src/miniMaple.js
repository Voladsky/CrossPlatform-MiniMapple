import { Lexer } from "./lexer"
import { Parser } from "./parser";
import { TermConverter, TermGrouper } from "./terms";
import { DerivationVisitor, DistributionVisitor, EvaluationVisitor, PrintVisitor, TermDecomposer } from "./visitors";

const MAX_ITER = 10;

class MiniMaple {
    constructor() {
        this.parser = new Parser();
        this.derivator = new DerivationVisitor();
        this.evaluator = new EvaluationVisitor();
        this.distributor = new DistributionVisitor();
        this.decomposer = new TermDecomposer();
        this.grouper = new TermGrouper();
        this.composer = new TermConverter();
        this.printer = new PrintVisitor();
    }
    differentiate(text, literal) {
        try {
            let ast = this.parser.parse(text);
            ast = this.distributor.visit(ast);
            let newAst;
            let lastStr = "";
            for (let i = 1; i < MAX_ITER; i++) {
                newAst = this.derivator.visit(ast, i);
                let str = this.printer.visit(newAst);
                console.log(str);
                if (lastStr === str) break;
                lastStr = str
            }
            newAst = this.evaluator.visit(newAst, literal)
            console.log(this.printer.visit(newAst));
            newAst = this.distributor.visit(newAst);
            console.log(this.printer.visit(newAst));
            const terms = this.decomposer.visit(newAst);
            const grouped = this.grouper.group(terms);
            const composed = this.composer.toAST(grouped);
            console.log(this.printer.visit(composed));
            return this.printer.visit(composed);
        } catch (e) {
            console.error(e.message);
            throw new MiniMapleError("MiniMaple failed to find the derivative", e)
        }
    }
}

class MiniMapleError extends Error {
    constructor(message, originalError) {
        super(message);
        this.name = this.constructor.name;
        this.originalError = originalError
        Error.captureStackTrace(this, this.constructor);
    }
}

export { MiniMaple, MiniMapleError }
