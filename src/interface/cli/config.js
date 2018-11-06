"use strict";

const Conf = require('conf');
const store = new Conf();
const storeSafe = require('keytar');

const SERVICE = 'jira-worklog';

const setProject = (project) => store.set('project', project);
const getProject = () => store.get('project') || '';
const hasProject = () => getProject().length > 0;

const getHost = () => store.get('host') || '';
const setHost = (host) => store.set('host', host);
const hasHost = () => getHost().length > 0;

const getAccount = () => store.get('account') || '';
const setAccount = (account) => store.set('account', account);
const hasAccount = () => getAccount().length > 0;

const setPassword = (password) => {
    if (hasAccount()) {
        storeSafe.setPassword(SERVICE, getAccount(), password);
    }
    return Promise.resolve();
};
const getPassword = () => {
    if (hasAccount()) {
        return storeSafe.getPassword(SERVICE, getAccount()).then(password => password || '');
    } else {
        return '';
    }
};
const hasPassword = async () => (await getPassword()).length > 0;

const clear = () => {
    if (hasAccount()) {
        storeSafe.deletePassword(SERVICE, getAccount());
        store.clear();
    }
    return Promise.resolve();
};

module.exports = {
    getProject: getProject,
    setProject: setProject,
    hasProject: hasProject,
    getHost: getHost,
    setHost: setHost,
    hasHost: hasHost,
    getAccount: getAccount,
    setAccount: setAccount,
    hasAccount: hasAccount,
    getPassword: getPassword,
    setPassword: setPassword,
    hasPassword: hasPassword,
    clear: clear,
};
