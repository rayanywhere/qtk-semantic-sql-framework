const assert = require('assert');
const path = require('path');
const walk = require('klaw-sync');

const Command = require('./src/command');
const Select = require('./src/command/select');
const SelectOne = require('./src/command/select_one');
const Count = require('./src/command/count');
const Insert = require('./src/command/insert');
const Update = require('./src/command/update');
const Delete = require('./src/command/delete');
const Join = require('./src/join');
const Not = require('./src/condition/not');
const And = require('./src/condition/and');
const Or = require('./src/condition/or');
const Statement = require('./src/condition/statement');

let config = undefined;
let models = undefined;

module.exports = class {

    static get Keyword() {
        return {
            Select: (name) => {
                return new Select(name, extractModelConfig(name))
            },
            SelectOne: (name) => {
                return new SelectOne(name, extractModelConfig(name))
            },
            Count: (name) => {
                return new Count(name, extractModelConfig(name))
            },
            Insert: (name) => {
                return new Insert(name, extractModelConfig(name))
            },
            Update: (name) => {
                return new Update(name, extractModelConfig(name))
            },
            Delete: (name) => {
                return new Delete(name, extractModelConfig(name))
            },
            Join: (name, type, fieldLeft, fieldRight) => {
                return new Join(name, extractModelConfig(name).model, type, fieldLeft, fieldRight)
            },
            Not: (condition) => {
                return new Not(condition)
            },
            And: (conditions) => {
                return new And(conditions)
            },
            Or: (conditions) => {
                return new Or(conditions)
            },
            Statement: (field, op, value) => {
                return new Statement(field, op, value)
            },
            Ops: {
                EQ: '=',
                GT: '>',
                GE: '>=',
                LT: '<',
                LE: '<=',
                NE: '!=',
                LIKE: 'like'
            }
        };
    }


    static setup(modelsDir, configDir) {
        config = require(path.resolve(configDir));

        models = walk(path.resolve(modelsDir), {
            nodir: true,
        }).map(item => path.basename(item.path, '.js')).reduce((prev, curr) => {
            prev[curr] = require(`${path.resolve(modelsDir)}/${curr}.js`);
            return prev;
        }, {});
    }

    static run(router, sql) {
        let connParam = config[router]
        let connection = mysql.createConnection({
            host: connParam.host,
            port: connParam.port,
            user: connParam.user,
            password: connParam.password,
            database: connParam.database
        });

        return new Promise((resolve, reject) => {
            connection.query(sql, function (error, results, fields) {
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

function extractModelConfig(name) {
    assert(models[name], `model(${name}) missing specific mysql config`);
    assert(config[models[name].router], `database(${config[models[name].router]}) missing config`);
    return {
        model: models[name].structure,
        connParam: config[models[name].router]
    }
}