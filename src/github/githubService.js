const {Octokit} = require("@octokit/rest");

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

async function uploadMarkdown(path, content, message) {
    const encoded = Buffer
    .from(content)
    .toString("base64");

    await octokit.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path,
        message,
        content: encoded
    })
}
module.exports = {uploadMarkdown}