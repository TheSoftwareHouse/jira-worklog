"use strict";

const inquirer = require('inquirer');
const _ = require('lodash');
const Config = require('./cli/config');
const Parser = require('./cli/parser/chrono');
const Prompter = require('./cli/prompter/inquirer');
const JiraExtension = require('../extension/jira');
const GitExtension = require('../extension/git');

const run = async (phrase) => {
    while (!Config.hasProject()) await Prompter.promptProject().then(project => Config.setProject(project));
    while (!Config.hasHost()) await Prompter.promptHost().then(host => Config.setHost(host));
    while (!Config.hasAccount()) await Prompter.promptAccount().then(account => Config.setAccount(account));
    while (!(await Config.hasPassword())) await Prompter.promptPassword().then(password => Config.setPassword(password));
    
    const Jira = JiraExtension.initialize(Config.getHost(), Config.getAccount(), await Config.getPassword());

    const chosenDay = Parser.parseDay(phrase);

    const gitTasks = await Promise.resolve(GitExtension.getSuggestedTaskKeys(Config.getProject(), chosenDay))
        .then(Jira.findTasksWithKeys)
        .then(tasks => tasks.map(task => task.key + ' - ' + task.name));
    
    const jiraTasks = await Jira.getSuggestedTaskKeys(Config.getProject(), chosenDay)
        .then(Jira.findTasksWithKeys)
        .then(tasks => tasks.map(task => task.key + ' - ' + task.name));
    
    if ([...gitTasks, ...jiraTasks].length === 0) {
        console.log('Could not found any tasks for given day.');
        return;
    }
    
    const chosenTask = await Prompter.promptTask(chosenDay, [
        new inquirer.Separator('Git'),
        ...gitTasks,
        new inquirer.Separator('Jira'),
        ...jiraTasks,
    ]);
    
    const worklogs = await Jira.getWorklogs(Config.getProject(), chosenDay);
    const hoursAlready = worklogs.reduce((sum, worklog) => sum + worklog.hours, 0);
    const hours = Array.from({length: Config.getHoursPerDay()}, (x, i) => i + 1).reverse();
    const chosenHours = await Prompter.promptHours(hours.map(n => `${n}h`), Config.getHoursPerDay() - hoursAlready);

    const confirmed = await Prompter.promptConfirmation(chosenHours, chosenTask);
    if (confirmed) {
        await Jira.sendWorklog(chosenDay, chosenTask, chosenHours);
        console.log(`Successfully logged ${chosenHours}h of work.`);
    } else {
        console.log('Aborted.');
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
