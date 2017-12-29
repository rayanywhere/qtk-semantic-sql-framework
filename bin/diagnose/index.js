#!/usr/bin/env node
const opts = require('opts');
const path = require('path');
const Ajv = require('ajv');
const ajv = new Ajv();
const walk = require('klaw-sync');
const assert = require('assert');

const Schema = require('./schema');

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
}
], true);

let config = undefined;
let models = undefined;

try {
    //set config, models in retriveEnv function
    retriveEnv(path.resolve(opts.get('models-dir')), path.resolve(opts.get('config-dir')));
    //check database config
    assert(ajv.validate(Schema.Config, config), `bad config file, details: ${ajv.errorsText()}`);
    Object.keys(models).forEach(name => {
        //check model name
        assert(name.match(/^[a-z][a-z0-9]*(_[a-z][a-z0-9]*)*$/) !== null, `bad name, model = ${name}`);
        //check model definition
        assert(ajv.validate(Schema.Model, models[name]), `bad model file(${name}, details: ${ajv.errorsText()}`)
    })
    console.log('all correct');
}catch(err) {
    console.log(err.stack);
    process.exit(-1);
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