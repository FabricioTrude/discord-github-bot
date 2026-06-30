const simpleGit = require("simple-git")
const {existsSync} = require("fs")

const git = workspaceGid()
function workspaceGid(){return simpleGit("workspace")}

async function commitAndPush(message) {
    await git.add(".")
    const status = await git.status();
    if (status.files.length === 0) return;

    const branches = await git.branch();
    if (!branches.all.includes("komorebi")) {
        await git.checkoutLocalBranch("komorebi");
    } else {
        await git.checkout("komorebi");
    }
    await git.commit(message, undefined, {
        "--amend": null
    });
    await git.push("origin", "komorebi", {
        "--force": null
    });
}
async function pushKomorebi(){
    await git.push("origin", "komorebi", {"--force": null});
}
async function prepareWorkspace(){
    if (!existsSync("workspace")){
        await cloneWorkspace();
    } else {
        await updateWorkspace();
    }
    await git.config("user.name", process.env.GIT_AUTHOR_NAME)
    await git.config("user.email", process.env.GIT_AUTHOR_EMAIL)
}
async function cloneWorkspace(){
    const git = simpleGit();
    await git.clone(
        `https://${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPOSITORY}.git`,
        "workspace"
    );
    const repo = simpleGit("workspace");
    await repo.checkout("komorebi");
}
async function updateWorkspace(){
    const repo = simpleGit("workspace");
    await repo.checkout("komorebi")
    await repo.pull("origin", "komorebi");
}
module.exports = {commitAndPush, pushKomorebi, prepareWorkspace}
