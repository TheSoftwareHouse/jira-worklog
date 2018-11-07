"use strict";

const Config = require('./cli/config');

const parser = require('./cli/input/parser');
const prompts = require('./cli/input/prompter');
const logger = require('./cli/output/logger');

//fixme use "source/suggestions" modules for getting task keys
const JiraExtension = require('../extension/jira');
const GitExtension = require('../extension/git');

const run = async (phrase) => {
    while (!Config.hasProject()) await prompts.askForProject().then(project => Config.setProject(project));
    while (!Config.hasHost()) await prompts.askForHost().then(host => Config.setHost(host));
    while (!Config.hasAccount()) await prompts.askForAccount().then(account => Config.setAccount(account));
    while (!(await Config.hasPassword())) await prompts.askForPassword().then(password => Config.setPassword(password));
    
    const Jira = JiraExtension.initialize(Config.getHost(), Config.getAccount(), await Config.getPassword());

    const chosenDay = parser.parseDay(phrase);
    
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
    
    const chosenTask = await prompts.promptTask(chosenDay, tasks);
    if (chosenTask === null) {
        logger.error('Could not find any task to choose from.');
        return;
    }
    
    const hours = Array.from({length: Config.getHoursPerDay()}, (x, i) => i + 1).reverse();
    const chosenHours = await prompts.promptHours(hours.map(n => `${n}h`), await hoursAlready || Config.getHoursPerDay());

    const confirmed = await prompts.promptConfirmation(chosenHours, chosenTask);
    if (confirmed) {
        await Jira.sendWorklog(chosenDay, chosenTask, chosenHours);
        logger.info(`Successfully logged ${chosenHours}h of work.`);
    } else {
        logger.info('Ok, aborted.');
    }
};

const phrase = process.argv.slice(2).join(' ').trim();

switch (phrase) {
    case 'reset':
        Config.clear().then(() => logger.info('All cleared.'));
        break;
    default:
        run(phrase).catch(() => logger.error('An error occured. Please try again or contact the author. Sorry!'));
}
