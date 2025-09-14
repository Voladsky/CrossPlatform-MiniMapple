import { Lexer } from "./lexer"
import { Parser } from "./parser";
import { TermConverter, TermGrouper } from "./terms";
import { DerivationVisitor, DistributionVisitor, EvaluationVisitor, PrintVisitor, TermDecomposerVisitor, MathJaxVisitor } from "./visitors";
import { Logger } from "./logger"

const MAX_ITER = 10;

class MiniMaple {
    constructor() {
        this.parser = new Parser();
        this.derivator = new DerivationVisitor();
        this.evaluator = new EvaluationVisitor();
        this.distributor = new DistributionVisitor();
        this.decomposer = new TermDecomposerVisitor();
        this.grouper = new TermGrouper();
        this.composer = new TermConverter();
        this.printer = new MathJaxVisitor();
        this.logger = new Logger();
    }
    differentiate(text, literal) {
        try {
            let ast = this.parser.parse(text);
            this.logger.log(`F(${literal}) &= ${this.printer.visit(ast)}`)
            this.logger.log(`F'(${literal}) &=`)
            ast = this.distributor.visit(ast);
            let newAst;
            let maxAst = this.derivator.visit(ast, -1);
            let maxStr = this.printer.visit(maxAst);
            for (let i = 1; i < MAX_ITER; i++) {
                newAst = this.derivator.visit(ast, i);
                let str = this.printer.visit(newAst);
                this.logger.log(`&= ${str}`);
                if (maxStr === str) break;
            }
            newAst = this.evaluator.visit(newAst, literal)
            this.logger.log(`&= ${this.printer.visit(newAst)}`);
            newAst = this.distributor.visit(newAst);
            this.logger.log(`&= ${this.printer.visit(newAst)}`);
            const terms = this.decomposer.visit(newAst);
            const grouped = this.grouper.group(terms);
            const composed = this.composer.toAST(grouped);
            this.logger.log(`&= ${this.printer.visit(composed)}`);
            const result = this.evaluator.visit(composed, literal)
            this.logger.log(`&= ${this.printer.visit(result)}`);
            return this.printer.visit(result);
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
