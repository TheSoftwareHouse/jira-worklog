"use strict";

const JiraClient = require('jira-connector');
const _ = require('lodash');

module.exports = {
    initialize: (host, account, password) => {
        const client = new JiraClient({
            host: host,
            basic_auth: {username: account, password: password}
        });

        return {
            getWorklogs: (project, day) =>
                findWorklogs(client, project, day),

            getSuggestedTaskKeys: (project, day) =>
                Promise
                    .all([
                        findCommentedTasks(client, project, day),
                        findAssignedTasks(client, project, day)
                    ])
                    .then(([commented, assigned]) => _.uniqBy([...commented, ...assigned], 'key'))
                    .then(tasks => tasks.map(task => task.key)),

            findTasksWithKeys: (keys) =>
                client
                    .search
                    .search({jql: 'key in (' + keys.join(', ') + ')'})
                    .then(result => result.issues.map(task => { return {key: task.key, name: task.fields.summary}})),

            sendWorklog: (day, task, hours) =>
                client
                    .issue
                    .addWorkLog({
                        issueKey: task,
                        notifyUsers: false,
                        worklog: {timeSpent: hours, started: jiraDateTime(day)}
                    }),
        };
    }
};

const jiraDateTime = (day) => new Date(day).toISOString().replace('Z', '+0000');
const dayStart = (day) => (day + ' 00:00');
const dayEnd = (day) => (day + ' 23:59');

const findCommentedTasks = async (client, project, day) => {
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
        });
};

const findAssignedTasks = async (client, project, day) => {
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
        );
};

const findWorklogs = async (client, project, day) => {
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
        });
};
