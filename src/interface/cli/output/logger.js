"use strict";

const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    json: false,
    format: winston.format.cli(),
    transports: [new winston.transports.Console()]
});

module.exports = logger;