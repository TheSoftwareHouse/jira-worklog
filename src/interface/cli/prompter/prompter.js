"use strict";

const inquirer = require('inquirer');

module.exports = {
    // promptAll: () => {
    //     return Promise.all([]);
    // },
    promptProject: () => {
        return inquirer
            .prompt([{
                name: 'project',
                type: 'input',
                message: 'Set project key (like "JRA")',
            }])
            .then(({project}) => project)
    },
    promptHost: () => {
        return inquirer
            .prompt([{
                name: 'host',
                type: 'input',
                message: 'Set base URL (like "jira.atlassian.net")',
            }])
            .then(({host}) => host)
    },
    promptAccount: () => {
        return inquirer
            .prompt([{
                name: 'account',
                type: 'input',
                message: 'Jira login',
            }])
            .then(({account}) => account)
    },
    promptPassword: async () => {
        return inquirer
            .prompt([{
                name: 'password',
                type: 'password',
                message: 'Jira password',
            }])
            .then(({password}) => password)
    },
};
