const fs = require("fs/promises");
const {ChannelType} = require("discord.js");
const {buildThreadMarkdown} = require("./markdown/generateMarkdown");

let client
function setClient(c){client = c}

function getCategoryDir(thread){
    const name = thread.parent.name.toLowerCase();
    console.log(name)
    if (name.includes("core")) return "docs/core"
    if (name.includes("lab")) return "docs/lab"
    if (name.includes("loreum")) return "docs/loreum"
    if (name.includes("arty")) return "docs/arty"
    if (name.includes("mechanum")) return "docs/mechanum"
    return "docs/others"
}

async function syncAllForums(){
    const guilds = client.guilds.cache
    for (const guild of guilds.values()){
        const channels = await guild.channels.fetch();
        const forums = channels.filter(
            c => c.type === ChannelType.GuildForum
        )
        for (const forum of forums.values()){
            await syncForum(forum)
        }
    }
}

async function syncForum(forum){
    const threads =  await forum.threads.fetchActive()
    const dir = getCategoryDir(forum)
    const registry = await loadRegistry(dir)
    for (const thread of threads.threads.values()){
        const last = thread.lastMessage?.createdTimestamp ?? 0;
        const saved = registry[thread.id] ?? 0;
        if (saved !== last){
            const markdown = await buildThreadMarkdown(thread);
            await writeThreadFileFromContent(thread, markdown);
            registry[thread.id] = last;
        }
    }
    await saveRegistry(dir, registry)
}

async function writeThreadFileFromContent(thread, markdownContent) {
    const filename = thread.name
        .toLowerCase()
        .replaceAll(" ", "-");

    const dir = `docs/${thread.parent.name.toLowerCase()}`;
    const filePath = `workspace/${dir}/${filename}.md`;
    await fs.mkdir(`workspace/${dir}`, { recursive: true });
    await fs.writeFile(filePath, markdownContent);
    const categoryDir = getCategoryDir(thread);
    await registry(thread, categoryDir);
    return filePath;
}

async function registry(thread, dir){
    const data = await loadRegistry(dir);
    data[thread.id] = thread.lastMessage?.createdTimestamp ?? 0;
    await saveRegistry(dir, data)
}

async function loadRegistry(dir) {
    try {
        return JSON.parse(await fs.readFile(`workspace/${dir}/.registry.json`, "utf-8"));
    } catch {
        return {};
    }
}

async function saveRegistry(dir, registry) {
    await fs.writeFile(
        `workspace/${dir}/.registry.json`,
        JSON.stringify(registry, null, 2)
    );
}

export {
    getCategoryDir,
    writeThreadFileFromContent,
    loadRegistry,
    saveRegistry,
    registry,
    syncAllForums,
    setClient
}