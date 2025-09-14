import { BinOpNode, NumberNode, OperationType, VariableNode } from "./astnodes";

export class TermGrouper {
    group(terms) {
        const grouped = new Map();
        for (const term of terms) {
            this._tryoptimize_vars(term);
            const key = this._createKey(term);
            if (grouped.has(key)) {
                grouped.get(key).coef += term.coef
            }
            else {
                grouped.set(key, { ...term });
            }
        }
        return Array.from(grouped.values());
    }
    _tryoptimize_vars(term) {
        const newterm = { coef: term.coef, vars: [], exps: {} };
        for (const variable in term.vars) {
            try {
                const termlist = JSON.parse(variable);
                const groupedVar = JSON.stringify(this.group(termlist));
                newterm.vars.push(groupedVar);
                newterm.exps[groupedVar] = exps[variable];
            }
            catch (e) {
                newterm.vars.push(variable)
                newterm.exps[variable] = variable;
                continue;
            }
        }
    }
    _createKey(term) {
        const sortedVars = [...term.vars].sort();

        const varWithExp = sortedVars.map((element) => {
            return `${element}^${term.exps[element]}`;
        })

        return varWithExp.join("*") ?? 'constant';
    }
}

export class TermConverter {
    toAST(terms) {
        if (terms.length === 0) return new NumberNode(0);
        if (terms.length === 1) return this.toNode(terms[0]);

        let result = this.toNode(terms[0]);
        for (const term of terms.slice(1)) {
            if (term.coef > 0) {
                result = new BinOpNode(
                    result,
                    OperationType.ADD,
                    this.toNode(term)
                )
            }
            else {
                term.coef *= -1
                result = new BinOpNode(
                    result,
                    OperationType.SUBTRACT,
                    this.toNode(term)
                )
            }
        }
        return result;
    }
    toNode(term) {
        let result = new NumberNode(term.coef)
        if (term.vars.length === 0) {
            return result
        }
        for (const variable of term.vars) {
            try {
                const termListVar = JSON.parse(variable);
                const right = this.toAST(termListVar);
                let rightASTNodes;
                if (term.exps[variable] !== 1) {
                    rightASTNodes = new BinOpNode(
                        right, OperationType.POWER, new NumberNode(term.exps[variable])
                    )
                } else {
                    rightASTNodes = right;
                }
                result = new BinOpNode(result, OperationType.MULTIPLY,
                    rightASTNodes
                )
            }
            catch (e) {
                let rightASTNodes;
                if (term.exps[variable] !== 1) {
                    rightASTNodes = new BinOpNode(
                        new VariableNode(variable), OperationType.POWER, new NumberNode(term.exps[variable])
                    )
                } else {
                    rightASTNodes = new VariableNode(variable);
                }
                result = new BinOpNode(result, OperationType.MULTIPLY,
                    rightASTNodes
                );
            }
        }
        return result;
    }
}

