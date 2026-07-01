const simpleGit = require("simple-git")
const {existsSync} = require("fs")
const {rm} = require("fs/promises")

let repo;

function workspaceGit(){return simpleGit("workspace")}

async function prepareWorkspace(){
    await rm("workspace", {
        recursive: true,
        force: true
    })
    await cloneWorkspace();
    const git = workspaceGit();
    await git.addConfig("user.name", process.env.GIT_AUTHOR_NAME)
    await git.addConfig("user.email", process.env.GIT_AUTHOR_EMAIL)
}

async function cloneWorkspace() {
    const git = simpleGit();
    const url = `https://${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}.git`;
    await git.clone(url, "workspace");
    repo = simpleGit("workspace");
    await repo.checkout("komorebi");
}

async function commitAndPush(message) {
    const git = workspaceGit();
    await git.add(".")
    const status = await git.status();
    if (status.files.length === 0) return;

    const branches = await git.branch();
    if (!branches.all.includes("komorebi")) {
        await git.checkoutLocalBranch("komorebi");
    } else {
        await repo.fetch()
        const branches = await git.branch(["-a"]);
        console.log(branches.all)
    }
    await git.commit(message, undefined, {
        "--amend": null
    });
    await git.push("origin", "komorebi", {
        "--force": null
    });
}
async function pushKomorebi(){
    const git = workspaceGit();
    await git.push("origin", "komorebi", {"--force": null});
}

module.exports = {commitAndPush, prepareWorkspace}
