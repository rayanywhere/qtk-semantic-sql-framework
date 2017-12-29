const Condition = require('../');
const assert = require('assert');

class Not extends Condition {
    constructor(item) {
        super();
        assert(item instanceof Condition, 'bad condition NOT');
        this._item = item;
    }

    get conditionSql() {
        return `(NOT ${this._item.conditionSql})`;
    }

    get conditionParams() {
        return this._item.conditionParams;
    }
}

module.exports = Not;