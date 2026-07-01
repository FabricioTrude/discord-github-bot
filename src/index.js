require('dotenv').config();

const PORT = process.env.PORT || 3000;
const http = require("http");

http.createServer((req, res) => {
    res.writeHead(200);
    res.end("OK");
}).listen(process.env.PORT, () => {console.log(`Server is listening on port ${PORT}`)});

const {Client, GatewayIntentBits, ChannelType, Partials} = require('discord.js');
const {commitAndPush, prepareWorkspace} = require("./git/gitService");
const {buildThreadMarkdown} = require("./markdown/generateMarkdown");
const {writeThreadFileFromContent, syncAllForums, setClient} = require("./functions");

const client = new Client({
    intents:[
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.once("clientReady", async () => {
    setClient(client);
    await prepareWorkspace();
    console.log(`${client.user.tag} is online!`);
    await syncAllForums();
    console.log("Threads atualizadas!")
})

client.on("threadCreate", async thread => {
    if (!thread.parent || thread.parent.type !== ChannelType.GuildForum) return;
    scheduleSync(thread);
})

client.on("messageCreate", async (message) => {
    console.log("mensagem enviada")
    if (!isForumThread(message)) return;
    scheduleSync(message.channel);
})

client.on("messageUpdate", async (_, message) => {
    console.log("mensagem atualizada")
    if (!isForumThread(message)) return;
    scheduleSync(message.channel);
});

function isForumThread(message){
    if (!message.guild) return false
    if (!message.channel.isThread()) return false
    return message.channel.parent?.type === ChannelType.GuildForum;
}

async function syncThread(thread){
    try {
        const markdown = await buildThreadMarkdown(thread);
        const filePath = await writeThreadFileFromContent(thread, markdown);

        await commitAndPush(`docs: update ${thread.name}`);
        console.log("THREAD UPDATED " + filePath);
    } catch (err) {
        console.error(err);
    }
}

const timers = new Map();

function scheduleSync(thread) {
    const id = thread.id;
    if (timers.has(id)) {
        clearTimeout(timers.get(id));
    }
    timers.set(id, setTimeout(() => {
        syncThread(thread);
        timers.delete(id);
    }, 10000));
}

client.login(process.env.DISCORD_TOKEN);