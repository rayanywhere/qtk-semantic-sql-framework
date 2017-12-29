const assert = require('assert');

class Join {
    constructor(name, model, type, fieldLeft, fieldRight) {
        this._name = name;
        this._model = model;
        this._type = type.toUpperCase();
        assert(['LEFT', 'RIGHT', 'INNER'].includes(this._type), `error join type(${this._type})`);
        this._fieldLeft = fieldLeft;
        this._fieldRight = fieldRight;
    }

    get joinSql() {
        return ` ${this._type} JOIN ?? ON ??=??`;
    }

    get joinParams() {
        return [this._name, this._fieldLeft, this._fieldRight]
    }

    get fieldSql() {
        let fields = []
        for (let field of Object.keys(this._model)) {
            fields.push(`\`${this._name}\`.\`${field}\` as \`${this._name}^${field}\``);
        }
        return ` ,${fields.join(' ,')}`;
    }
}

module.exports = Join;
