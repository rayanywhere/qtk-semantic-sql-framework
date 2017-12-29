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
        //step 1. prepare fields
        let fields = [];
        for (let field of Object.keys(this._model)) {
            fields.push(`\`${this._name}\`.\`${field}\` as \`${this._name}^${field}\``);
        }
        let joinFieldSql = '';
        this._joins.forEach(join => {
            joinFieldSql += join.fieldSql;
        });

        //step 2. build & run query
        this._sql = `SELECT ${fields.join(',')} ${joinFieldSql} FROM \`${this._name}\``;
        if (this._joins.length > 0) {
            this._parseJoins(this._joins);
        }
        if(this._condition !== undefined) {
            this._parseCondition(this._condition);
        }
        if (this._sorts !== undefined) {
            this._parseSorts(this._sorts);
        }

        this._sql += 'LIMIT 0,1';

        let [row] = await this._execute();

        if (row === undefined) return null;

        //step 3. parse fields

        let formattedRow = {};
        for (let [rawfield, value] of Object.entries(row)) {
            const parts = rawfield.match(/^(.+?)\^([^\^]+)$/);
            assert(parts instanceof Array, 'internal error, cannot parse field');
            const name = parts[1];
            const field = parts[2];
            if (formattedRow[name] === undefined) {
                formattedRow[name] = {};
            }
            formattedRow[name][field] = value;
        }
        if (Object.keys(formattedRow).length > 1) {
            return formattedRow;
        }
        return formattedRow[Object.keys(formattedRow)[0]];
    }
};