import { BinOpNode, ExpressionNode, NumberNode, OperationType, VariableNode } from "./astnodes";
import { Lexer, Token, TokenType } from "./lexer"

/*

Grammar in BNF form:
--------------------------------------------------
program   ::= expr EOF
expr      ::= term (('+' || '-') term)*
term      ::= factor (('*' || '/') factor)*
factor    ::= primary ('^' num)
primary   ::= NUMBER
              | VARIABLE
              | '(' expr ')'
num       ::= NUMBER
--------------------------------------------------

*/
class Parser {
    constructor() {
        this.lexer = new Lexer();
        this.curTok = null;
    }
    reset(text) {
        this.lexer.reset(text);
        this.curTok = this.lexer.nextToken();
    }
    check(checkTypes) {
        return checkTypes.includes(this.curTok.type);
    }
    expect(expectedTypes) {
        const index = expectedTypes.indexOf(this.curTok.type);
        if (index === -1) throw new ParserError(`Expected ${expectedTypes.join(",")}, found ${this.curTok.type}`, this.curTok.col);
        return expectedTypes[index];
    }
    eat(expectedTypes) {
        const result = this.expect(expectedTypes);
        this.curTok = this.lexer.nextToken();
        return result;
    }
    parse(text) {
        this.reset(text);
        const result = this.expr();
        this.eat([TokenType.EOF]);
        return result;
    }
    expr() {
        let left = this.term();
        while (this.check([TokenType.PLUS, TokenType.MINUS])) {
            const op = this.eat([TokenType.PLUS, TokenType.MINUS]);
            const right = this.term();
            left = new BinOpNode(left, op === TokenType.PLUS ? OperationType.ADD : OperationType.SUBTRACT, right);
        }
        return left;

    }
    term() {
        const left = this.factor();
        while (this.check([TokenType.ASTERISK, TokenType.DIVIDE])) {
            const op = this.eat([TokenType.ASTERISK, TokenType.DIVIDE]);
            const right = this.factor();
            return new BinOpNode(left, op === TokenType.ASTERISK ? OperationType.MULTIPLY : OperationType.DIVIDE, right);
        }
        return left;

    }
    factor() {
        const left = this.primary();
        if (this.check([TokenType.CARET])) {
            this.eat([TokenType.CARET]);
            const right = this.number();
            return new BinOpNode(left, OperationType.POWER, right);
        }
        return left;
    }
    number() {
        this.expect([TokenType.NUMBER]);
        const res = new NumberNode(this.curTok.val);
        this.eat([TokenType.NUMBER]);
        return res;
    }
    primary() {
        let res = null;
        switch (this.curTok.type) {
            case TokenType.ID:
                res = new VariableNode(this.curTok.val);
                this.eat([TokenType.ID]);
                return res;
            case TokenType.NUMBER:
                res = new NumberNode(this.curTok.val);
                this.eat([TokenType.NUMBER]);
                return res;
            case TokenType.LPAR:
                this.eat([TokenType.LPAR]);
                res = this.expr();
                this.eat([TokenType.RPAR]);
                return res;
            default:
                this.expect([TokenType.ID, TokenType.NUMBER, TokenType.LPAR, TokenType.RPAR]);
        }
    }
}

class ParserError extends Error {
    constructor(message, pos) {
        super(message);
        this.col = pos;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export {Parser, ParserError}
