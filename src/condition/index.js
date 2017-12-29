const assert = require('assert');

module.exports = class {
    get conditionSql() {
        throw new Error('this method is supposed to be implemented by subclass');
    }

    get conditionParams() {
        throw new Error('this method is supposed to be implemented by subclass');
    }
}