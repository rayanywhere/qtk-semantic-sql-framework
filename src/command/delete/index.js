const assert = require('assert');
const Command = require('../');
const Condition = require('../../condition');

module.exports = class extends Command {
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
        this._sql = `DELETE FROM \`${this._name}\``;
        if(this._condition !== undefined) {
            this._parseCondition(this._condition);
        }
        if(this._limit !== undefined) {
            this._parseLimit(this._limit);
        }

        return await this._execute();
    }
}