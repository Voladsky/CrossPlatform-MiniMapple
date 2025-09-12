import {MiniMaple} from "../src/miniMaple";

describe('MiniMaple', () => {
    it('should differentiate simple polynomials', () => {
        const miniMaple = new MiniMaple();
        expect(miniMaple.differentiate("x^2 + 2*x + 1").toString()).toBe("2*x + 2");
    })
    it('should be able to differentiate factor with coefficients', () => {
        const miniMaple = new MiniMaple();
        expect(miniMaple.differentiate("5*x^6").toString()).toBe("30*x^5");
    });
    it('should throw error at ill-formed text', () => {
        const miniMaple = new MiniMaple();
        expect(miniMaple.differentiate("x^2 +")).toThrow(MiniMapleError);
    });
});
