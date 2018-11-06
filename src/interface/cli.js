"use strict";

const Config = require('./cli/config');
const Parser = require('./cli/parser/chrono');
const Prompter = require('./cli/prompter/inquirer');

const JiraExtension = require('../extension/jira');

const run = async (phrase) => {
    while (!Config.hasProject()) await Prompter.promptProject().then(project => Config.setProject(project));
    while (!Config.hasHost()) await Prompter.promptHost().then(host => Config.setHost(host));
    while (!Config.hasAccount()) await Prompter.promptAccount().then(account => Config.setAccount(account));
    while (!(await Config.hasPassword())) await Prompter.promptPassword().then(password => Config.setPassword(password));
    
    const Jira = JiraExtension.initialize(Config.getHost(), Config.getAccount(), await Config.getPassword());

    const project = Config.getProject();
    const chosenDay = Parser.parseDay(phrase);

    const tasks = await Jira.getSuggestedTasks(project, chosenDay);
    const chosenTask = await Prompter.promptTask(chosenDay, tasks.map(task => task.key + ' - ' + task.name));

    const worklogs = await Jira.getWorklogs(project, chosenDay);
    const hoursLogged = worklogs.reduce((sum, worklog) => sum + worklog.hours, 0);
    const hours = Array.from({length: 8}, (x, i) => i + 1).reverse();
    const chosenHours = await Prompter.promptHours(hours.map(n => `${n}h`), hoursLogged);

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
