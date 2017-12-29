module.exports = {
	structure: {
		id: {
			type: "string",
			length: 32,
			index: "unique"
		},
		amount: {
			type: "integer"
		},
		userId: {
			type: "string",
			length: 32
		}
	},
	router: "db_test"
}
