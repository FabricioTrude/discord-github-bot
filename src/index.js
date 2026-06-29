require('dotenv').config();
const fs = require("fs/promises");
const pathModule = require("path");
const {Client, GatewayIntentBits, ChannelType, Partials} = require('discord.js');
const {commitAndPush} = require("./git/gitService");
const {generateMarkdown, buildThreadMarkdown} = require("./markdown/generateMarkdown");

const client = new Client({
    intents:[
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.once("clientReady", () => {
    console.log(`${client.user.tag} is online!`);
})

client.on("threadCreate", async thread => {
    if (!thread.parent || thread.parent.type !== ChannelType.GuildForum) return;
    try {
        const filePath = await createThread(thread);
        await commitAndPush(`feat: add ${thread.name}.md`);
        console.log(`CREATED: ${filePath}`);
    } catch (error) {
        console.error(error)
    }
})

client.on("messageCreate", async (message) => {
    if (!message.guild) return;
    if (!message.channel.isThread()) return;
    const thread = message.channel;
    if (thread.parent?.type !== ChannelType.GuildForum) return;

    try {
        const markdown = await buildThreadMarkdown(thread);
        const filePath = await writeThreadFileFromContent(thread, markdown);

        await commitAndPush(`docs: update ${thread.name}`);

        console.log("THREAD UPDATED (messageCreate)");
    } catch (err) {
        console.error(err);
    }
});

client.on("messageUpdate", async (_, message) => {
    if (!message.guild) return;
    if (!message.channel?.isThread()) return;

    const thread = message.channel;

    if (thread.parent?.type !== ChannelType.GuildForum) return;

    try {
        const markdown = await buildThreadMarkdown(thread);

        const filePath = await writeThreadFileFromContent(thread, markdown);

        await commitAndPush(`docs: update ${thread.name}`);

        console.log("THREAD UPDATED (messageUpdate)");
    } catch (err) {
        console.error(err);
    }
});

// client.on("messagereactionAdd", async (reaction, user) => {
//     if (user.bot) return;
//     try{
//         await reaction.fetch();
//
//         const emoji = reaction.emoji.name;
//
//         if (emoji !== "🚀") return;
//
//         const message = reaction.message;
//
//         if (!message.channel.isThread()) return;
//
//         const thread = message.channel;
//
//         if (thread.parent?.type !== ChannelType.GuildForum) return;
//
//         console.log("🚀 PUBLISH TRIGGER DETECTED");
//
//         await pushKomorebi();
//
//         console.log("✅ komorebi pushed");
//     } catch(e){
//         console.error(e)
//     }
// })

async function createThread(thread) {
    const starterMessage = await thread.fetchStarterMessage();
    return await writeThreadFile(thread, starterMessage);
}


async function writeThreadFile(thread, message) {
    const markdown = generateMarkdown(thread, message);
    const filename = thread.name
        .toLowerCase()
        .replaceAll(" ", "-");
    const dir = `docs/${thread.parent.name.toLowerCase()}`;
    const filePath = `workspace/${dir}/${filename}.md`;
    await fs.mkdir(`workspace/${dir}`, {recursive: true});
    await fs.writeFile(filePath, markdown);
    await registry(thread, filePath);
    return filePath;
}

async function writeThreadFileFromContent(thread, markdownContent) {
    const filename = thread.name
        .toLowerCase()
        .replaceAll(" ", "-");

    const dir = `docs/${thread.parent.name.toLowerCase()}`;

    const filePath = `workspace/${dir}/${filename}.md`;

    await fs.mkdir(`workspace/${dir}`, { recursive: true });

    await fs.writeFile(filePath, markdownContent);
    await registry(thread, dir);
    return filePath;
}

async function registry(thread, filePath){
    const registry = await loadRegistry();
    registry[thread.id] = filePath.replace("workspace/", "");
    await saveRegistry(registry, filePath)
}

async function loadRegistry() {
    try {
        return JSON.parse(await fs.readFile("workspace/.registry.json", "utf-8"));
    } catch {
        return {};
    }
}

async function saveRegistry(registry, dir) {
    await fs.writeFile(
        `workspace/${dir}/.registry.json`,
        JSON.stringify(registry, null, 2)
    );
}

client.login(process.env.DISCORD_TOKEN);