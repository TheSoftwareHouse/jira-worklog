"use strict";

const JiraClient = require('jira-connector');

module.exports = {
    initialize: (host, account, password) => {
        const username = account;
        const client = new JiraClient({
            host: host,
            basic_auth: {username: account, password: password}
        });

        return {
            getWorklogs: (project, day) =>
                findWorklogs(client, project, username, day),

            getSuggestedTaskKeys: (project, day) =>
                client
                    .search
                    .search({jql: `project = ${project} AND assignee was currentUser() ON ${day} AND status was "In progress" ON ${day} ORDER BY updated ASC`})
                    .then(result => result.issues.map(task => ({key: task.key, name: task.fields.summary})))
                    .then((tasks) => tasks.map(task => task.key)),

            findTasksWithKeys: (keys) => {
                if (keys.length === 0) {
                    return [];
                }
                
                return client
                    .search
                    .search({jql: 'key in (' + keys.join(', ') + ')'})
                    .then(result => result.issues.map(task => { return {key: task.key, name: task.fields.summary}}));
            },

            sendWorklog: (day, task, hours) =>
                client
                    .issue
                    .addWorkLog({
                        issueKey: task,
                        notifyUsers: false,
                        worklog: {timeSpent: `${hours}h`, started: jiraDateTime(day)}
                    }),
        };
    }
};

const jiraDateTime = day => new Date(day).toISOString().replace('Z', '+0000');
const dayStart = day => `${day} 00:00`;
const dayEnd = day => `${day} 23:59`;

const findWorklogs = async (client, project, username, day) => {
    return client
        .search
        .search({
            jql: `project = ${project} AND worklogAuthor = currentUser() AND worklogDate = ${day} ORDER BY updated ASC`,
            fields: ['worklog']
        })
        .then(res => {
            return res.issues.map(task => {
                const spentSeconds = task.fields.worklog
                    .worklogs
                    .filter(worklog =>
                        (worklog.author.emailAddress === username || worklog.author.name === username) 
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
