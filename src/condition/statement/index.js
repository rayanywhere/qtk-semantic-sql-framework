const Condition = require('../');
const assert = require('assert');
const sqlstring = require('sqlstring');

class Statement extends Condition {
    constructor(field, op, value) {
        super();
        assert(typeof field === 'string' && typeof op === 'string' && (typeof value === 'string' || typeof value === 'number'), 'bad statement');
        this._field = field;
        this._op = op;
        this._value = value;
    }

    get conditionSql() {
        return `(?? ${this._op} ?)`;
    }

    get conditionParams() {
        return [this._field, this._value];
    }
}

module.exports = Statement;