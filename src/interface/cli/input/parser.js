"use strict";

const chrono = require('chrono-node');
const moment = require('moment');

module.exports = {
    parseDay: (phrase) => {
        phrase = phrase || 'today';
        const day = chrono.parseDate(phrase).getTime() > chrono.parseDate('now').getTime() ?
            moment(chrono.parseDate(phrase, startOfWeek())) :
            moment(chrono.parseDate(phrase));
        return day.format('YYYY-MM-DD');
    },
};

function startOfWeek() {
    const diff = new Date().getDate() - new Date().getDay() + (new Date().getDay() === 0 ? -6 : 1);
    return new Date(new Date().setDate(diff));
}