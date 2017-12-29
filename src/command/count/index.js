const assert = require('assert');
const Command = require('../');
const Condition = require('../../condition');
const Join = require('../../join')

module.exports = class extends Command {
    join(join) {
        assert(join instanceof Join, 'expect param to be an instance of Join class');
        this._joins.push(join);
        return this;
    }

    where(condition) {
        assert(condition instanceof Condition, 'expect param to be an instance of Condition class');
        this._condition = condition;
        return this;
    }

    async run() {
        this._sql = `SELECT count(*) as cnt FROM \`${this._name}\``;
        if (this._joins.length > 0) {
            this._parseJoins(this._joins);
        }
        if (this._condition !== undefined) {
            this._parseCondition(this._condition);
        }
        
        let results = await this._execute();
        if (results.length < 1) {
            throw new Error('error when executing COUNT sql');
        }
        return parseInt(results[0]['cnt']);
    }    
}