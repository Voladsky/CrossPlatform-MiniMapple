class TokenType {
    static #_ID         = "ID";
    static #_NUMBER     = "NUMBER";
    static #_PLUS       = "PLUS";
    static #_MINUS      = "MINUS";
    static #_ASTERISK   = "ASTERISK";
    static #_CARET      = "CARET";
    static #_DIVIDE     = "DIVIDE";
    static #_LPAR       = "LPAR";
    static #_RPAR       = "RPAR";

    static get ID() { return this.#_ID }
    static get NUMBER() { return this.#_NUMBER }
    static get PLUS() { return this.#_PLUS}
    static get MINUS() { return this.#_MINUS}
    static get ASTERISK() { return this.#_ASTERISK}
    static get CARET() { return this.#_CARET}
    static get DIVIDE() { return this.#_DIVIDE}
    static get LPAR() { return this.#_LPAR}
    static get RPAR() { return this.#_RPAR}
}

class Token {
    constructor(type, val, col) {
        this.type = type;
        this.val = val;
        this.col = col;
    }
}

class Lexer {
    constructor(text = "") {
        this.reset(text);
    }
    reset(text) {
        this.text = text;
        this.pos = 0;
        this.curChar = this.text.length > 0 ? text[0] : null;
    }
    nextChar() {
        this.pos++;
        if (this.pos < this.text.length) {
            this.curChar = this.text[this.pos];
        }
        else {
            this.curChar = null;
        }
    }
    skipWhitespaces() {
        while (this.curChar && this.curChar.trim() == '') {
            this.nextChar();
        }
    }
    number() {
        let res = "";
        while (this.curChar && (this.curChar >= '0' && this.curChar <= '9' || this.curChar === '.')) {
            res += this.curChar;
            this.nextChar();
        }
        return parseFloat(res);
    }
    id() {
        let id = "";
        while (this.curChar && (this.curChar >= 'A' && this.curChar <= "Z" || this.curChar >= 'a' && this.curChar <= 'z')) {
            id += this.curChar;
            this.nextChar();
        }
        return id;
    }
    nextToken() {
        while (this.curChar) {
            if (this.curChar.trim() === "") {
                this.skipWhitespaces();
                continue;
            }
            if (this.curChar >= '0' && this.curChar <= '9') {
                const oldpos = this.pos;
                const num = this.number();
                return new Token(TokenType.NUMBER, num, oldpos);
            }
            if (this.curChar >= 'A' && this.curChar <= "Z" || this.curChar >= 'a' && this.curChar <= 'z') {
                const oldpos = this.pos;
                const id = this.id();
                return new Token(TokenType.ID, id, oldpos);
            }
            switch (this.curChar) {
                case '+':
                    this.nextChar();
                    return new Token(TokenType.PLUS, '+', this.pos - 1);
                case '-':
                    this.nextChar();
                    return new Token(TokenType.MINUS, '-', this.pos - 1);
                case '*':
                    this.nextChar();
                    return new Token(TokenType.ASTERISK, '*', this.pos - 1);
                case '/':
                    this.nextChar();
                    return new Token(TokenType.DIVIDE, '/', this.pos - 1);
                case '^':
                    this.nextChar();
                    return new Token(TokenType.CARET, '^', this.pos - 1);
                case '(':
                    this.nextChar();
                    return new Token(TokenType.LPAR, '(', this.pos - 1);
                case ')':
                    this.nextChar();
                    return new Token(TokenType.RPAR, ')', this.pos - 1);
                default:
                    throw new LexerError(`Unexpected token: '${this.curChar}'`, this.pos);
            }
        }
        return null;
    }
    tokenize(text) {
        this.reset(text);
        const tokens = [];
        while (true) {
            const newtok = this.nextToken();
            if (!newtok) break;
            tokens.push(newtok);
        }
        return tokens;
    }
}

class LexerError extends Error {
    constructor(message, pos) {
        super(message);
        this.col = pos;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export{Lexer, TokenType, Token, LexerError}
