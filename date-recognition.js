"use strict";

const moment = require('moment');
const chrono = require('chrono-node');

module.exports = {
    recognize: (phrase) => {
        phrase = phrase || 'today';
        const day = chrono.parseDate(phrase).getTime() > chrono.parseDate('now').getTime() ?
            moment(chrono.parseDate(phrase, startOfWeek())).format('YYYY-MM-DD') :
            moment(chrono.parseDate(phrase)).format('YYYY-MM-DD');

        return moment(day, "YYYY-MM-DD");
    },
};

function startOfWeek() {
    const diff = new Date().getDate() - new Date().getDay() + (new Date().getDay() === 0 ? -6 : 1);
    return new Date(new Date().setDate(diff));
}