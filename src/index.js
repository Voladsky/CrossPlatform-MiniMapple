import { MiniMaple } from "./miniMaple";

document.getElementById('diffForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const expression = document.getElementById('expression').value;
    const literal = document.getElementById('literal').value;
    const outputElement = document.getElementById('output');

    if (!expression) {
        outputElement.textContent = 'Please enter an expression.';
        return;
    }

    try {
        const miniMaple = new MiniMaple();
        const derivative = miniMaple.differentiate(expression, literal);
        outputElement.innerHTML = `<strong>Expression:</strong> ${expression}<br><strong>Derivative:</strong> ${derivative}`;
    } catch (error) {
        outputElement.textContent = 'Error: ' + error.message;
    }
});
