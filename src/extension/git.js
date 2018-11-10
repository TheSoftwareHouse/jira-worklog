"use strict";

const childProcess = require('child_process');

module.exports = {
    getSuggestedTaskKeys: async (project, day) =>
        new Promise(resolve =>
            childProcess.exec(`git log --all --pretty=format:"%s" --since="${day} 00:00" --until="${day} 23:59" --author="$(git config user.name)"`, (err, stdout, stderr) => {
                const commits = stdout.trim().split('\n');
                const regexp = new RegExp(`${project}\-[0-9]+`, 'g');
                const keys = commits
                    .map(commit => regexp.exec(commit))
                    .filter(matches => matches)
                    .map(matches => matches[0]);
                resolve(keys);
            })
        )
};