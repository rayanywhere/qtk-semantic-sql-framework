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
        description: 'add|remove',
        value: true,
        required: true
    },
    {
        short: 'f',
        long: 'field',
        description: 'create/remove index on which field',
        value: true,
        required: true
    },
    {
        short: 'i',
        long: 'index',
        description: 'index type, allow [unique|ordinary]',
        value: true,
        required: false
    },

], true);

let config = undefined;
let models = undefined;
const modelName = opts.get('model');
const action = opts.get('action');
const field = opts.get('field');
const index = opts.get('index');

(async () => {
    checkInputConstraint(action, index);
    //set config, models in retriveEnv function
    retriveEnv(path.resolve(opts.get('models-dir')), path.resolve(opts.get('config-dir')));
    let connection = await createConnection(config[models[modelName].router]);
    let sql = '';
    switch(action) {
        case 'add': {
            switch(index) {
                case 'unique': {
                    sql = `ALTER TABLE \`${modelName}\` ADD UNIQUE INDEX \`${field}\`(\`${field}\`)`;
                    break;
                }
                case 'ordinary': {
                    sql = `ALTER TABLE \`${modelName}\` ADD INDEX \`${field}\`(\`${field}\`)`;
                    break;
                }
            }
            break;
        }
        case 'remove': {
            sql = `ALTER TABLE \`${modelName}\` DROP INDEX \`${field}\``;
            break;
        }
    }
    await executeSql(connection, sql);
    connection.end();
})().catch(err => {
    console.error(err.stack);
    process.exit(-1);
});



function checkInputConstraint(action, index) {
    if (action === 'add') {
        assert(['unique', 'ordinary'].includes(index), `index only allow [unique, ordinary]`);
    } else {
        assert(index === undefined, `on remove process, index is needless`);
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