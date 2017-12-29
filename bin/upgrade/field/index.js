#!/usr/bin/env node
const opts = require('opts');
const fsx = require('fs-extra');
const mysql = require('mysql');
const walk = require('klaw-sync');
const path = require('path');
const assert = require('assert');

opts.parse([
    {
        short: 'c',
        long: 'config-dir',
        description: 'config directory',
        value: true,
        required: true
    },
    {
        short: 'm',
        long: 'models-dir',
        description: 'models directory',
        value: true,
        required: true
    },
    {
        short: 'o',
        long: 'model',
        description: 'if exist, create table for specific model, else for all model',
        value: true,
        required: true
    },
    {
        short: 'a',
        long: 'action',
        description: 'add|remove|update',
        value: true,
        required: true
    },
    {
        short: 'f',
        long: 'field',
        description: 'the filed name to upgrade',
        value: true,
        required: true
    },
    {
        short: 't',
        long: 'type',
        description: 'integer|string',
        value: true,
        required: false
    },
    {
        short: 'i',
        long: 'index',
        description: 'unique|ordinary',
        value: true,
        required: false
    },
    {
        short: 'l',
        long: 'length',
        description: 'when type is string, length is needed',
        value: true,
        required: false
    }

], true);

let config = undefined;
let models = undefined;
const modelName = opts.get('model');
const action = opts.get('action');
const field = opts.get('field');
const type = opts.get('type');
const index = opts.get('index');
const lenght = opts.get('length');

(async () => {
    checkInputConstraint(action, type, index, lenght);
    //set config, models in retriveEnv function
    retriveEnv(path.resolve(opts.get('models-dir')), path.resolve(opts.get('config-dir')));
    let connection = await createConnection(config[models[modelName].router]);
    let sqls = buildSqls(action, modelName, field, type, index, lenght);
    for (let sql of sqls) {
        await executeSql(connection, sql);
    }
    connection.end();
})().catch(err => {
    console.error(err.stack);
    process.exit(-1);
});




function buildSqls(action, tableName, field, type, index, lenght) {
    let sqls = [];
    switch(action) {
        case 'add': {
            sqls.push(`ALTER TABLE ${tableName} ADD COLUMN ${field} ${getSqlType(type, lenght)} not null`);
            if (index) {
                sqls.push(`ALTER TABLE ${tableName} ADD ${index == 'unique' ? `UNIQUE`:``} INDEX ${field}(${field})`);
            }
            break;
        }
        case 'remove': {
            sqls.push(`ALTER TABLE ${tableName} DROP COLUMN ${field}`);
            break;
        }
        case 'update': {
            sqls.push(`ALTER TABLE ${tableName} MODIFY ${field} ${getSqlType(type, lenght)} not null`);
            if (index) {
                sqls.push(`ALTER TABLE ${tableName} ADD ${index == 'unique' ? `UNIQUE`:``} INDEX ${field}(${field})`);
            }
            break;
        }
    }
    return sqls;
}

function getSqlType(type, lenght) {
    switch(type) {
        case 'string': return `VARCHAR(${lenght})`;
        case 'integer': return `INTEGER`;
        case 'boolean':  return `BOOLEAN`;
    }
    throw new Error(`unknown type(${type})`);
}

function checkInputConstraint(action, type, index, lenght) {
    if (action == 'add') assert(['string', 'integer', "boolean"].includes(type), `only allow [string, integer, boolean], ${type} is invalid`);
    if (index !== undefined) assert(['unique', 'ordinary'].includes(index), `index only allow [unique, ordinary]`);
    if (type == 'string') {
        assert(lenght !== undefined && parseInt(lenght) > 0, `when type is string, must assign length and length should > 0`);
    } else {
        assert(lenght === undefined, `when type is integer, length is needless`);
    }
}

function retriveEnv(modelsDir, configDir) {
    config = require(path.resolve(configDir));
    models = walk(path.resolve(modelsDir), {
        nodir: true
    }).map(item => path.basename(item.path, '.js')).reduce((prev, curr) => {
        prev[curr] = require(`${path.resolve(modelsDir)}/${curr}.js`);
        return prev;
    }, {});
}

async function createConnection(connParam) {
    return await mysql.createConnection({
        host: connParam.host,
        port: connParam.port,
        user: connParam.user,
        password: connParam.password,
        database: connParam.database
    });
}

function executeSql(connection, sql) {
    return new Promise((resolve, reject) => {
        connection.query(sql, (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}