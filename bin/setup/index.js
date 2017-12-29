#!/usr/bin/env node
const fsx = require('fs-extra');
const mysql = require('mysql');
const walk = require('klaw-sync');
const path = require('path');
const opts = require('opts');

opts.parse([{
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
        description: 'if exist, create a single model table, else for all model',
        value: true,
        required: false
    }
], true);

let config = undefined;
let models = undefined;
let specificModel = opts.get('model');

(async() => {
    //set config, models in retriveEnv function
    retriveEnv(path.resolve(opts.get('models-dir')), path.resolve(opts.get('config-dir')));
    for (let name of Object.keys(models)) {
        if (specificModel && name != specificModel)
            continue;
        let connection = await createConnection(config[models[name].router]);
        let database = config[models[name].router].database
        await ensureDBCreated(connection, database);
        await createTable(connection, database, name, models[name].structure);
        connection.end();
        console.log(`success create table ${name}`);
    }
})().catch(err => {
    console.log(err.stack);
    process.exit(-1);
})


function retriveEnv(modelsDir, configDir) {
    config = require(path.resolve(configDir));
    models = walk(path.resolve(modelsDir), {
        nodir: true
    }).map(item => path.basename(item.path, '.js')).reduce((prev, curr) => {
        prev[curr] = require(`${path.resolve(modelsDir)}/${curr}.js`);
        return prev;
    }, {});
}

async function ensureDBCreated(connection, dbName) {
    await executeSql(connection, `CREATE DATABASE IF NOT EXISTS ${dbName}`);
}

async function createTable(connection, database, tableName, structure) {
    let sql = '';
    Object.entries(structure).forEach(([field, desc]) => {
        sql += sql.length > 0 ? `,\`${field}\`` : `\`${field}\``;
        switch (desc.type.toLowerCase()) {
            case 'string':
                sql += ` VARCHAR(${desc.length}) NOT NULL`;
                break;
            case 'integer':
                sql += ` INTEGER NOT NULL`;
                break;
            case 'boolean': {
                sql += ` BOOLEAN NOT NULL`;
                break;
            }
        }
    });
    Object.entries(structure).forEach(([field, desc]) => {
        switch (desc.index) {
            case 'unique':
                sql += `,UNIQUE INDEX ${field}(\`${field}\`)`;
                break;
            case 'ordinary':
                sql += `,INDEX ${field}(\`${field}\`)`;
                break;
        }
    })
    sql = `CREATE TABLE IF NOT EXISTS ${database}.${tableName}(${sql})`;
    await executeSql(connection, sql);
}

async function createConnection(connParam) {
    return await mysql.createConnection({
        host: connParam.host,
        port: connParam.port,
        user: connParam.user,
        password: connParam.password
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