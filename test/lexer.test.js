import {Lexer} from "../src/lexer.js";

describe("Lexer", () => {
    it('should tokenize the text of polynomial', () => {
        const lexer = new Lexer();
        const text = "x^2-(3*x+4/5)";
        const result = [
            new Token(TokenType.ID, "x", 0),
            new Token(TokenType.CARET, "^", 1),
            new Token(TokenType.NUMBER, "2", 2),
            new Token(TokenType.MINUS, "-", 3),
            new Token(TokenType.LPAR, "(", 4),
            new Token(TokenType.NUMBER, "3", 5),
            new Token(TokenType.ASTERISK, "*", 6),
            new Token(TokenType.ID, "x", 7),
            new Token(TokenType.PLUS, "+", 8),
            new Token(TokenType.NUMBER, "4", 9),
            new Token(TokenType.DIVIDE, "/", 10),
            new Token(TokenType.NUMBER, "5", 11),
            new Token(TokenType.RPAR, ")", 12)
        ];
        expect(lexer.tokenize(text)).toEqual(result);
    });
    it('should skip whitespaces', () => {
        const lexer = new Lexer();
        const text = "x ^ 2 - 5     * x     "
        const result = [
            new Token(TokenType.ID, "x", 0),
            new Token(TokenType.CARET, "^", 2),
            new Token(TokenType.NUMBER, "2", 4),
            new Token(TokenType.MINUS, "-", 6),
            new Token(TokenType.NUMBER, "5", 8),
            new Token(TokenType.ASTERISK, "*", 14),
            new Token(TokenType.ID, "x", 16)
        ];
        expect(lexer.tokenize(text)).toEqual(result);
    });
    it('should throw an error to illegal token', () => {
        const lexer = new Lexer();
        const text = "x + @";
        expect(lexer.tokenize(text)).toThrow(expect.objectContaining({
            name: "LexerError",
            message: expect.stringContaining("Unexpected token"),
            col: 4
        }));
    });
    it('should tokenize variables as longest A-Za-z sequence', () => {
        const lexer = new Lexer();
        const text = "sin(x)"
        const result = [
            new Token(TokenType.ID, "sin", 0),
            new Token(TokenType.LPAR, "(", 3),
            new Token(TokenType.ID, "x", 4),
            new Token(TokenType.RPAR, ")", 5)
        ]
        expect(lexer.tokenize(text)).toEqual(result);
    })
    it('should tokenize real numbers', () => {
        const lexer = new Lexer();
        const text = "3.141592";
        expect(lexer.tokenize(text)).toEqual(new Token(TokenType.NUMBER, "3.141592"));
    })

})
