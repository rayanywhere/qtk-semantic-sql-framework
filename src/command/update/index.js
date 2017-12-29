const assert = require('assert');
const Command = require('../');
const Condition = require('../../condition');

module.exports = class extends Command {
    data(data) {
        assert(typeof data === 'object', 'expect data to be an object');  
        this._data = data;
        return this;
    }

    where(condition) {
        assert(condition instanceof Condition, 'expect param to be an instance of Condition class');
        this._condition = condition;
        return this;
    }

    limit(number) {
        assert(Number.isInteger(number), 'expect param of limit function to be an integer');
        this._limit = number;
        return this;
    }

    async run() {
        this._sql = `UPDATE \`${this._name}\``;
        this._parseData(this._data);
        if(this._condition !== undefined) {
            this._parseCondition(this._condition);
        }
        if(this._limit !== undefined) {
            this._parseLimit(this._limit);
        }

        return await this._execute();
    }
}