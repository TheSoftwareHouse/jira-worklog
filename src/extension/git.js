"use strict";

const execSync = require('child_process').execSync;

module.exports = {
    getSuggestedTaskKeys: (project, day) => {
        const output = execSync(`git log --all --pretty=format:"%s" --since="${day} 00:00" --until="${day} 23:59" --author="$(git config user.name)"`);
        const commits = output.toString().trim().split('\n');
        const regexp = new RegExp(`${project}\-[0-9]+`, 'g');
        const keys = commits
            .map(commit => regexp.exec(commit))
            .filter(matches => matches)
            .map(matches => matches[0]);
        return Promise.resolve(keys);
    }
};