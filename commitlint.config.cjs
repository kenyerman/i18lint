const fs = require('fs');

const SCOPES_PATH = './scopes.json';

const getScopes = () => {
    const scopesFile = fs.readFileSync(SCOPES_PATH);
    const scopesData = JSON.parse(scopesFile);
    const scopes = Object.keys(scopesData);

    return [2, 'always', scopes];
}

module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-enum': getScopes,
        'github-issue-reference': [2, 'always']
    },
    plugins: [
        {
            rules: {
                'github-issue-reference': ({ subject }) => [
                    !!subject.match(/\(#\d*\)$/gm)?.length,
                    `Subject should end with a reference to a github issue id in the following format: (#123)`,
                ]
            },
        },
    ],
};
