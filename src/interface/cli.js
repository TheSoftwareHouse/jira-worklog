"use strict";

const inquirer = require('inquirer');

const Conf = require('conf');
const config = new Conf();

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
const ConfigHelper = require('./cli/config/helper');
const Prompter = require('./cli/prompter/prompter');

const day = Parser.parseDay(phrase);

async function main() {
    while (ConfigHelper.isConfigured() === false) {
        await Prompter.promptProject().then(project => ConfigHelper.setProject);
        await Prompter.promptHost().then(host => ConfigHelper.setHost);
        await Prompter.promptAccount().then(account => ConfigHelper.setAccount);
        await Prompter.promptPassword().then(password => ConfigHelper.setPassword);
    }

    Promise
        .all([
            Source.tasks(config.get('project'), day),
            Source.worklogs(config.get('project'), day)
        ])
        .then(([tasks, worklogs]) => {
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
        .catch(console.log);

}

main();