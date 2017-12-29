module.exports = {
	structure: {
		id: {
			type: "string",
			length: 32,
			index: "unique"
		},
		name: {
			type: "string",
			length: 20,
		},
		loginCount: {
			type: "integer"
		},
		logoutCount: {
			type: "integer"
		}
	},
	router: "db_test"
}
