"use strict";

const keytar = require('keytar');
const Conf = require('conf');
const config = new Conf();

const JiraClient = require('jira-connector');
const _ = require('lodash');

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
    tasks: (project, day) => {
        return initialize()
            .then(client => Promise.all([
                findCommentedTasks(client, project, day),
                findAssignedTasks(client, project, day)
            ]))
            .then(([commented, assigned]) => _.uniqBy([...commented, ...assigned], 'key'));
    },
    worklogs: (project, day) => {
        return initialize().then(client => findWorklogs(client, project, day));
    },
    log: (taskKey, day, spent) => {
        return initialize().then(client => logWork(client, taskKey, day, spent));
    },
};

function jiraDateTime(day) {
    return new Date(day).toISOString().replace('Z', '+0000');
}

function jiraErrorDump(err) {
    JSON.parse(err).body.errorMessages.forEach(msg => console.log("ERROR: " + msg));
}

function dayStart(day) {
    return day + ' 00:00';
}

function dayEnd(day) {
    return day + ' 23:59';
}

async function findCommentedTasks(client, project, day) {
    const userKey = await client.myself.getMyself().then(user => user.key);
    const jqlCommentedTasks = `project = ${project} AND status was in ("To Do", "In progress") ON ${day} ORDER BY created ASC`;
    return client
        .search
        .search({jql: jqlCommentedTasks, fields: ['comment', 'summary']})
        .then(result => {
            return result.issues
                .filter(task => {
                    let userComments = task.fields.comment.comments.filter(comment => {
                        return comment.author.key === userKey
                            && new Date(comment.created) >= new Date(dayStart(day))
                            && new Date(comment.created) <= new Date(dayEnd(day));
                    });
                    return 0 < userComments.length;
                })
                .map(task => {
                    return {
                        key: task.key,
                        name: task.fields.summary,
                    };
                });
        })
        .catch(jiraErrorDump)
}

async function findAssignedTasks(client, project, day) {
    const jql = `project = ${project} AND assignee was currentUser() ON ${day} ORDER BY updated ASC`;
    return client
        .search
        .search({jql: jql})
        .then(result => result.issues.map(task => {
                return {
                    key: task.key,
                    name: task.fields.summary
                };
            })
        )
        .catch(jiraErrorDump)
}

async function findWorklogs(client, project, day) {
    const userKey = await client.myself.getMyself().then(user => user.key);
    const jql =
        `project = ${project} ` +
        `AND worklogAuthor = currentUser() ` +
        `AND worklogDate = ${day} ` +
        `ORDER BY updated ASC`;
    return client
        .search
        .search({jql: jql, fields: ['worklog']})
        .then(res => {
            return res.issues.map(task => {
                const spentSeconds = task.fields.worklog
                    .worklogs
                    .filter(worklog => 
                        worklog.author.key === userKey
                        && new Date(worklog.started) >= new Date(dayStart(day))
                        && new Date(worklog.started) <= new Date(dayEnd(day))
                    )
                    .reduce((sum, worklog) => sum + worklog.timeSpentSeconds, 0);
                return {
                    key: task.key,
                    hours: Math.floor(spentSeconds / 3600)
                };
            })
        })
        .catch(jiraErrorDump)
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