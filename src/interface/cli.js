"use strict";

const Source = require('../service/source/jira');
const Logger = require('../service/logger');
const Parser = require('./cli/parser/chrono');
const ConfigHelper = require('./cli/config/helper');
const Prompter = require('./cli/prompter/prompter');

const run = async (phrase) => {
    while (ConfigHelper.isConfigured() === false) {
        await Prompter.promptProject().then(project => ConfigHelper.setProject);
        await Prompter.promptHost().then(host => ConfigHelper.setHost);
        await Prompter.promptAccount().then(account => ConfigHelper.setAccount);
        await Prompter.promptPassword().then(password => ConfigHelper.setPassword);
    }

    const project = ConfigHelper.getProject();
    
    const chosenDay = Parser.parseDay(phrase);

    const tasks = await Source.tasks(project, chosenDay);
    const chosenTask = await Prompter.promptTask(chosenDay, tasks.map(task => task.key + ' - ' + task.name));
    
    const worklogs = await Source.worklogs(project, chosenDay);
    const hoursLogged = worklogs.reduce((sum, worklog) => sum + worklog.hours, 0);
    const hours = Array.from({length: 8 - hoursLogged + 1}, (x, i) => i).slice(1).reverse();
    const chosenHours = await Prompter.promptHours(hours.map(n => `${n}h`));
            
    const confirmed = await Prompter.promptConfirmation(chosenHours, chosenTask);
    if (confirmed) {
        await Logger.log(chosenTask, chosenDay, chosenHours);
        console.log(`Successfully logged ${chosenHours} of work.`);
    } else {
        console.log('Aborted.');
    }
};

const phrase = process.argv.slice(2).join(' ').trim();

switch (phrase) {
    case 'reset':
        ConfigHelper.clear().then(() => console.log('All cleared.'));
        break;
    default:
        run(phrase).catch(console.log);
}
