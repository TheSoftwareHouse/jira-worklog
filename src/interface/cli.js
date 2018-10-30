"use strict";

const keytar = require('keytar');
const Conf = require('conf');
const config = new Conf();

const inquirer = require('inquirer');

const phrase = process.argv.slice(2).join(' ').trim();

if (phrase === 'reset') {
    if (config.get('account')) {
        keytar.deletePassword('jira-worklog', config.get('account'));
        config.clear();
    }

    console.log('All cleared.');
    return;
}

const Source = require('../service/source/jira');
const Logger = require('../service/logger');
const Parser = require('./cli/parser/chrono');

const day = Parser.parseDay(phrase);

inquirer
    .prompt([
        {type: 'input', name: 'project', message: 'Set project key (like "JRA")', when: () => !config.has('project')},
        {type: 'input', name: 'host', message: 'Set base URL (like "jira.atlassian.net")', when: () => !config.has('host')},
        {type: 'input', name: 'account', message: 'Login', when: () => !config.has('account')}
    ])
    .then(answers => {
        answers.project && config.set('project', answers.project);
        answers.host && config.set('host', answers.host);
        answers.account && config.set('account', answers.account);
        return keytar.getPassword('jira-worklog', config.get('account'));
    })
    .then(
        (password) => inquirer.prompt([{
            type: 'password',
            name: 'password',
            message: 'Password',
            when: () => password === null
        }]))
    .then((answers) => {
        answers.password && keytar.setPassword('jira-worklog', config.get('account'), answers.password);
        return Promise.all([
            Source.tasks(config.get('project'), day),
            Source.worklogs(config.get('project'), day)
        ]);
    })
    .then(([tasks, worklogs]) => {
        console.log([tasks, worklogs]);
        let hours = worklogs.reduce((sum, worklog) => sum + worklog.hours, 0);
        let hoursToChoose = Array.from({length: 8 - hours + 1}, (x, i) => i).slice(1).reverse().map(n => `${n}h`);
        return inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'task',
                    message: `Choose task (from ${day}):`,
                    choices: tasks.map(t => t.key + ' - ' + t.name),
                    filter: function (task) {
                        return task.match(/^\w+\-\d+/)[0];
                    }
                },
                {
                    type: 'list',
                    name: 'hours',
                    message: 'Choose time spent:',
                    choices: hoursToChoose,
                    filter: function (time) {
                        return time.match(/\d+/)[0];
                    }
                }
            ])
            .then(answers => {
                return inquirer
                    .prompt({
                        type: 'confirm',
                        name: 'confirmed',
                        message: `Do you confirm to log ${answers.hours}h of work in task ${answers.task}?`,
                        default: true
                    })
                    .then(answer => {
                        return {
                            key: answers.task,
                            spent: `${answers.hours}h`,
                            confirmed: answer.confirmed
                        };
                    });
            });
    })
    .then(request => {
        if (request.confirmed) {
            Logger
                .log(request.key, day, request.spent)
                .then(() => {
                    console.log(`Successfully logged ${request.spent} of work.`);
                });
        } else {
            console.log('Aborted.');
        }
    })
    .catch(console.log)
;
