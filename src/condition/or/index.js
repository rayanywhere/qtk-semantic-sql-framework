const Condition = require('../');
const assert = require('assert');

class Or extends Condition {
    constructor(items) {
        super();
        assert(items instanceof Array, 'bad condition OR');
        for(let item of items) {
            assert(item instanceof Condition, 'bad condition OR');
        }
        this._items = items;
    }

    get conditionSql() {
        return `(${this._items.map(item => item.conditionSql).join(' OR ')})`;
    }

    get conditionParams() {
		return this._items.reduce((acc, item) => acc.concat(item.conditionParams), []);
    }
}

module.exports = Or;
