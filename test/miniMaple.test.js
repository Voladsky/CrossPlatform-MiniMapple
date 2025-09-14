import {MiniMaple} from "../src/miniMaple";
import { PrintVisitor } from "../src/visitors";
import { LexerError } from "../src/lexer";
import { ParserError } from "../src/parser"

describe('MiniMaple', () => {
    const printer = new PrintVisitor();
    it('should differentiate simple polynomials', () => {
        const miniMaple = new MiniMaple();
        expect(miniMaple.differentiate("x^2 + 2*x + 1", "x")).toBe("2*x+2");
    })
    it('should be able to differentiate factor with coefficients', () => {
        const miniMaple = new MiniMaple();
        expect(miniMaple.differentiate("5*x^6", "x")).toBe("30*x^5");
    });
    it('should throw ParserError at ill-formed text', () => {
        const miniMaple = new MiniMaple();
        expect(() => miniMaple.differentiate("x^2 + * 3")).toThrow(expect.objectContaining({
            name: "MiniMapleError",
            message: expect.stringContaining(`MiniMaple failed to find the derivative`),
            originalError: expect.any(ParserError)
        }));
    });
    it('should throw LexerError at unexpected text', () => {
        const miniMaple = new MiniMaple();
        expect(() => miniMaple.differentiate("x^2 + @")).toThrow(expect.objectContaining({
            name: "MiniMapleError",
            message: expect.stringContaining(`MiniMaple failed to find the derivative`),
            originalError: expect.any(LexerError)
        }));
    })
});
