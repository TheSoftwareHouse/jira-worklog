"use strict";

const inquirer = require('inquirer');

module.exports = {
    promptProject: () =>
        inquirer
            .prompt([{
                name: 'project',
                type: 'input',
                message: 'Set project key (like "JRA")',
            }])
            .then(({project}) => project),

    promptHost: () =>
        inquirer
            .prompt([{
                name: 'host',
                type: 'input',
                message: 'Set base URL (like "jira.atlassian.net")',
            }])
            .then(({host}) => host),

    promptAccount: () =>
        inquirer
            .prompt([{
                name: 'account',
                type: 'input',
                message: 'Jira login',
            }])
            .then(({account}) => account),

    promptPassword: async () =>
        inquirer
            .prompt([{
                name: 'password',
                type: 'password',
                message: 'Jira password',
            }])
            .then(({password}) => password),

    promptTask: async (day, choices) => {
        if (!Array.isArray(choices)) {
            choices = Object
                .keys(choices)
                .filter(source => (choices[source] || []).length > 0)
                .map(source => [new inquirer.Separator(source), ...choices[source]])
                .reduce((acc, val) => acc.concat(val), []);
        }
        
        if (choices.length === 0) {
            return Promise.resolve(null);
        }
        
        return inquirer
            .prompt({
                type: 'list',
                name: 'task',
                message: `Choose task (from ${day}):`,
                choices: choices,
                filter: task => task.match(/^\w+\-\d+/)[0],
            })
            .then(({task}) => task);
    },

    promptHours: async (choices, defaultChoice) =>
        inquirer
            .prompt({
                type: 'list',
                name: 'hours',
                message: 'Choose time spent:',
                choices: choices,
                filter: time => time.match(/\d+/)[0],
                default: defaultChoice,
            })
            .then(({hours}) => hours),

    promptConfirmation: async (hours, task) =>
        inquirer
            .prompt({
                type: 'confirm',
                name: 'confirmed',
                message: `Do you confirm to log ${hours}h of work in task ${task}?`,
                default: true
            })
            .then(({confirmed}) => confirmed),
};
