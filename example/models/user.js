module.exports = {
	structure: {
		id: {
			type: "string",
			length: 32,
			index: "unique"
		},
		name: {
			type: "string",
			length: 20
		},
		gender: {
			type: "integer"
		},
		isVip: {
			type: "boolean"
		},
	},
	router: "db_test"
};
