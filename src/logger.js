// Logger class to handle both console and HTML output
export class Logger {
    constructor() {
        this.logs = [];
        this.showInHtml = true;
    }

    log(message) {
        // Always log to console
        console.log(message);

        // Store for HTML display
        this.logs.push(message);

        // Update HTML if enabled
        if (this.showInHtml) {
            this.updateHtml();
        }
    }

    error(message) {
        console.error(message);
        this.logs.push({ step: 'ERROR', message, type: 'error' });

        if (this.showInHtml) {
            this.updateHtml();
        }
    }

    clear() {
        this.logs = [];
        document.getElementById('logContent').innerHTML = '';
    }

    updateHtml() {
        const logContent = document.getElementById('logContent');
        logContent.innerHTML = `\\(\\begin{align}${this.logs.map(log =>
            `${log}`
        ).join('\\\\')}\\end{align}\\)`;
        MathJax.typeset()
    }

    setHtmlOutput(show) {
        this.showInHtml = show;
        if (show) {
            this.updateHtml();
        }
    }
}
