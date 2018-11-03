"use strict";

const Conf = require('conf');
const store = new Conf();
const storeSafe = require('keytar');

const SERVICE = 'jira-worklog';

module.exports = {
    isConfigured: () =>
        store.get('project') &&
        store.get('host') &&
        store.get('account') &&
        storeSafe.getPassword(SERVICE, store.get('account')),

    getProject: () =>
        store.get('project'),

    setProject: (project) =>
        store.set('project', project),

    setHost: (host) =>
        store.set('host', host),

    setAccount: (account) =>
        store.set('account', account),

    setPassword: (password) =>
        storeSafe.setPassword(SERVICE, store.get('account'), password),

    clear: () => {
        if (store.get('account')) {
            storeSafe.deletePassword(SERVICE, store.get('account'));
            store.clear();
        }
        return Promise.resolve();
    }
};