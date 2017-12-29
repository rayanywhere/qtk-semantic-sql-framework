const assert = require('assert');
const mysql = require('mysql');

module.exports = class {
    constructor(name, config) {
        this._model = config.model;
        this._connParam = config.connParam;
        this._name = name;
        this._data = undefined;
        this._condition = undefined;
        this._joins = [];
        this._sorts = undefined;
        this._range = undefined;
        this._limit = undefined;
        this._sql = '';
        this._params = [];
    }

    run() {
        throw new Error('run is supposed to be implemented by subclass');    
    }

    _parseData(data) {
        this._sql += ' SET ' + Object.keys(data).map(field => `\`${field}\`=?`).join(',');
        this._params = this._params.concat(Object.values(data));
    }

    _parseJoins(joins) {
        joins.forEach(join => {
            this._sql += join.joinSql;
            this._params = this._params.concat(join.joinParams);
        });    
    }

    _parseCondition(condition) {
        this._sql += ` WHERE ${condition.conditionSql}`;
        this._params = this._params.concat(condition.conditionParams);      
    }

    _parseSorts(sorts) {
        this._sql += ' ORDER BY ' + sorts.map(sort => `\`${sort.field}\` ${sort.order}`).join(',');
    }

    _parseRange(range) {
        this._sql += ` LIMIT ?,?`;
        this._params = this._params.concat([range.offset, range.number]);
    }

    _parseLimit(limit) {
        this._sql += ` LIMIT ?`;
        this._params = this._params.concat(limit);
    }

    _execute() {
        let connection = mysql.createConnection({
            host: this._connParam.host,
            port: this._connParam.port,
            user: this._connParam.user,
            password: this._connParam.password,
            database: this._connParam.database,
            typeCast: (field, next) => {
                if (field.type === 'TINY' && field.length === 1) {
                    return (field.string() === '1');
                }
                return next();
            }
        });

        return new Promise((resolve, reject) => {
            connection.query(this._sql, this._params, function (error, results, fields) {
                connection.end();
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    }
}
