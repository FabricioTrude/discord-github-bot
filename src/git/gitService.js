const simpleGit = require("simple-git")

const git = simpleGit("workspace")
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
module.exports = {commitAndPush, pushKomorebi}
