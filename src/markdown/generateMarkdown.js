async function generateMarkdown(thread, starterMessage) {
    return `
---
   >author: ${starterMessage.author.username}<br>
   >threadId: ${thread.id}<br>
   >created: ${starterMessage.createdAt}<br>
   >status: draft<br>
   --- 
   
   # ${thread.name}
   
   ${starterMessage.content}
   `;
}

async function buildThreadMarkdown(thread) {
    const starter = await thread.fetchStarterMessage();
    const markdown = await generateMarkdown(thread, starter);
    const messages = await thread.messages.fetch({limit: 100});
    const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    const messageBlock = sorted.map(msg => {
        return `> **${msg.author.username}** 
        ${msg.content}`})
        .join("\n\n")
    return markdown + "\n\n" + messageBlock;
}

module.exports = {generateMarkdown, buildThreadMarkdown}