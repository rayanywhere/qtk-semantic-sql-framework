const Condition = require('../');
const assert = require('assert');

class And extends Condition {
    constructor(items) {
        super();
        assert(items instanceof Array, 'bad condition AND');
        for(let item of items) {
            assert(item instanceof Condition, 'bad condition AND');
        }
        this._items = items;
    }

    get conditionSql() {
        return `(${this._items.map(item => item.conditionSql).join(' AND ')})`;
    }

    get conditionParams() {
        return this._items.reduce((acc, item) => acc.concat(item.conditionParams), []);
    }
}

module.exports = And;
