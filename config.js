require("dotenv").config();

module.exports = {
    token: process.env.TOKEN,
    guildId: process.env.GUILD_ID,

    trapChannelName: "🪤・no-escribas-aqui",
    logChannelName: "📋・logs-trampa",

    statsFile: "./stats.json",

    trap: {
        kickOnMessage: true,
        deleteMessage: true,
        mentionEveryone: true,
        mentionHere: true
    }
};
