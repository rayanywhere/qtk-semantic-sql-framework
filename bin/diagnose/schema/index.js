module.exports = {
    Config: {
        type: "object",
        patternProperties: {
            '.+': {
                type: "object",
                properties: {
                    host: {
                        type: "string"
                    },
                    port: {
                        type: "integer"
                    },
                    user: {
                        type: "string"
                    },
                    password: {
                        type: "string"
                    },
                    database: {
                        type: "string"
                    }
                },
                additionalProperties: false,
                required: ["host", "port", "user", "password", "database"]
            }
        }
    },

    Model: {
        type: 'object',
        properties: {
            structure: {
                type: "object",
                patternProperties: {
                    '.+': {
                        anyOf: [{
                                type: 'object',
                                properties: {
                                    type: {
                                        enum: ["string"]
                                    },
                                    length: {
                                        type: "integer",
                                        minimum: 1
                                    },
                                    index: {
                                        enum: ["unique", "ordinary"]
                                    }
                                },
                                additionalProperties: false,
                                required: ["type", "length"]
                            },
                            {
                                type: 'object',
                                properties: {
                                    type: {
                                        enum: ["integer", "boolean"]
                                    },
                                    index: {
                                        enum: ["unique", "ordinary"]
                                    }
                                },
                                additionalProperties: false,
                                required: ["type"]
                            }
                        ]
                    }
                }
            },
            router: {
                type: "string"
            }
        },
        additionalProperties: false,
        required: ['structure', 'router']

    }
}