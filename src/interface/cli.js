"use strict";

const inquirer = require('inquirer');
const _ = require('lodash');

const Config = require('./cli/config');
const Parser = require('./cli/parser/chrono');
const Prompter = require('./cli/prompter/inquirer');

//fixme use "source/suggestions" modules for getting task keys
const JiraExtension = require('../extension/jira');
const GitExtension = require('../extension/git');

const run = async (phrase) => {
    while (!Config.hasProject()) await Prompter.promptProject().then(project => Config.setProject(project));
    while (!Config.hasHost()) await Prompter.promptHost().then(host => Config.setHost(host));
    while (!Config.hasAccount()) await Prompter.promptAccount().then(account => Config.setAccount(account));
    while (!(await Config.hasPassword())) await Prompter.promptPassword().then(password => Config.setPassword(password));
    
    const Jira = JiraExtension.initialize(Config.getHost(), Config.getAccount(), await Config.getPassword());

    const chosenDay = Parser.parseDay(phrase);
    
    const tasks = await Promise
        .all([
            GitExtension.getSuggestedTaskKeys(Config.getProject(), chosenDay),
            Jira.getSuggestedTaskKeys(Config.getProject(), chosenDay),
        ])
        .then(([gitKeys, jiraKeys]) => {
            const allKeys = [...gitKeys, ...jiraKeys];
            return Jira.findTasksWithKeys(allKeys).then(tasks => ({
                'Git': tasks
                    .filter(task => gitKeys.indexOf(task.key) !== -1)
                    .map(task => task.key + ' - ' + task.name),
                'Jira': tasks
                    .filter(task => jiraKeys.indexOf(task.key) !== -1)
                    .map(task => task.key + ' - ' + task.name)
            }))
        });

    const hoursAlready = Jira
        .getWorklogs(Config.getProject(), chosenDay)
        .then(worklogs => worklogs.reduce((sum, worklog) => sum + worklog.hours, 0));
    
    const chosenTask = await Prompter.promptTask(chosenDay, tasks);
    if (chosenTask === null) {
        //fixme use different output/logging
        console.log('Could not find any task to choose from.');
        return;
    }
    
    const hours = Array.from({length: Config.getHoursPerDay()}, (x, i) => i + 1).reverse();
    const chosenHours = await Prompter.promptHours(hours.map(n => `${n}h`), await hoursAlready || Config.getHoursPerDay());

    const confirmed = await Prompter.promptConfirmation(chosenHours, chosenTask);
    if (confirmed) {
        await Jira.sendWorklog(chosenDay, chosenTask, chosenHours);
        console.log(`Successfully logged ${chosenHours}h of work.`);
    } else {
        console.log('Ok, aborted.');
    }
};

const phrase = process.argv.slice(2).join(' ').trim();

switch (phrase) {
    case 'reset':
        Config.clear().then(() => console.log('All cleared.'));
        break;
    default:
        run(phrase).catch(() => console.log('An error occured. Please try again or contact the author. Sorry!'));
}
