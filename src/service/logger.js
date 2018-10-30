"use strict";

const JiraClient = require('jira-connector');

const initialize = () => keytar
    .getPassword('jira-worklog', config.get('account'))
    .then((password) => new JiraClient({
        host: config.get('host'),
        basic_auth: {
            username: config.get('account'),
            password: password
        }
    }));

module.exports = {
    log: (taskKey, day, spent) => {
        return initialize().then(client => logWork(client, taskKey, day, spent));
    },
};

function jiraDateTime(day) {
    return new Date(day).toISOString().replace('Z', '+0000');
}

function logWork(client, taskKey, day, spent) {
    return client
        .issue
        .addWorkLog({
            issueKey: taskKey,
            notifyUsers: false,
            worklog: {timeSpent: spent, started: jiraDateTime(day)}
        })
        .catch(jiraErrorDump)
}