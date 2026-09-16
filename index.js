require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    EmbedBuilder,
    ChannelType
} = require("discord.js");

const fs = require("fs");
const config = require("./config");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ─────────────────────────────────────────────
// 📊 ESTADÍSTICAS
// ─────────────────────────────────────────────

function loadStats() {
    if (!fs.existsSync(config.statsFile)) {
        fs.writeFileSync(
            config.statsFile,
            JSON.stringify({ kicks: 0, bans: 0 }, null, 2)
        );
    }

    return JSON.parse(fs.readFileSync(config.statsFile, "utf8"));
}

function saveStats(stats) {
    fs.writeFileSync(
        config.statsFile,
        JSON.stringify(stats, null, 2)
    );
}

// ─────────────────────────────────────────────
// 🪤 CREAR / OBTENER CANALES
// ─────────────────────────────────────────────

async function getOrCreateChannel(guild, name, type = ChannelType.GuildText) {
    let channel = guild.channels.cache.find(
        c => c.name === name && c.type === type
    );

    if (!channel) {
        channel = await guild.channels.create({
            name,
            type
        });
    }

    return channel;
}

// ─────────────────────────────────────────────
// 🪤 PANEL DE LA TRAMPA
// ─────────────────────────────────────────────

function createTrapEmbed(stats) {
    return new EmbedBuilder()
        .setTitle("🪤・ZONA DE TRAMPA")
        .setDescription(
            [
                "## 🚫 NO ESCRIBAS AQUÍ",
                "",
                "Este canal está **monitorizado automáticamente**.",
                "Si envías un mensaje aquí, se activará la sanción configurada.",
                "",
                "### 📊 ESTADÍSTICAS",
                "",
                `👢 **KICKS**`,
                `> \`${stats.kicks}\``,
                "",
                `🔨 **BANS**`,
                `> \`${stats.bans}\``,
                "",
                "`🟢 PROTECCIÓN ACTIVA`",
                "",
                "━━━━━━━━━━━━━━━━━━━━━━━━━━",
                "🪤 **No escribas en este canal.**",
                "🤖 Sistema automático"
            ].join("\n")
        )
        .setFooter({
            text: "Anti-Trampa • Sistema automático"
        })
        .setTimestamp();
}

// ─────────────────────────────────────────────
// 📋 LOG
// ─────────────────────────────────────────────

function createLogEmbed(message, action) {
    return new EmbedBuilder()
        .setTitle("🪤・TRAMPA ACTIVADA")
        .setDescription(
            [
                `👤 **Usuario:** ${message.author}`,
                `🆔 **ID:** \`${message.author.id}\``,
                `📍 **Canal:** ${message.channel}`,
                "",
                `⚡ **Acción:** ${action}`,
                `📝 **Mensaje:** \`${message.content.slice(0, 500)}\``
            ].join("\n")
        )
        .setFooter({
            text: "Sistema Anti-Trampa"
        })
        .setTimestamp();
}

// ─────────────────────────────────────────────
// 🚀 BOT INICIADO
// ─────────────────────────────────────────────

client.once("ready", async () => {
    console.log(`✅ Conectado como ${client.user.tag}`);

    const guild = client.guilds.cache.get(config.guildId);

    if (!guild) {
        console.error("❌ No se encontró el servidor.");
        return;
    }

    try {
        // 🪤 Crear canal de trampa
        const trapChannel = await getOrCreateChannel(
            guild,
            config.trapChannelName
        );

        // 📋 Crear canal de logs
        const logChannel = await getOrCreateChannel(
            guild,
            config.logChannelName
        );

        console.log(`🪤 Trampa: ${trapChannel.name}`);
        console.log(`📋 Logs: ${logChannel.name}`);

        // Cargar estadísticas
        const stats = loadStats();

        // Enviar aviso principal
        await trapChannel.send({
            content: "@everyone @here",
            embeds: [
                createTrapEmbed(stats)
            ],
            allowedMentions: {
                parse: ["everyone"]
            }
        });

        console.log("📨 Panel de trampa enviado.");

    } catch (error) {
        console.error("❌ Error durante la configuración:", error);
    }
});

// ─────────────────────────────────────────────
// 🪤 DETECTAR MENSAJES
// ─────────────────────────────────────────────

client.on("messageCreate", async message => {
    if (message.author.bot) return;

    if (message.channel.name !== config.trapChannelName) return;

    const stats = loadStats();

    // Eliminar mensaje
    if (config.trap.deleteMessage) {
        try {
            await message.delete();
        } catch (error) {
            console.log("⚠️ No se pudo eliminar el mensaje.");
        }
    }

    // Kick
    if (config.trap.kickOnMessage) {
        try {
            const member = await message.guild.members.fetch(
                message.author.id
            );

            if (member.kickable) {
                await member.kick(
                    "Escribió en el canal de la trampa."
                );

                stats.kicks++;
                saveStats(stats);

                console.log(
                    `👢 Kick: ${message.author.tag}`
                );

                // Buscar canal de logs
                const logChannel =
                    message.guild.channels.cache.find(
                        c => c.name === config.logChannelName
                    );

                if (logChannel) {
                    await logChannel.send({
                        embeds: [
                            createLogEmbed(
                                message,
                                "👢 **Kick automático**"
                            )
                        ]
                    });
                }
            } else {
                console.log(
                    `⚠️ No puedo expulsar a ${message.author.tag}`
                );
            }

        } catch (error) {
            console.error("❌ Error al ejecutar el kick:", error);
        }
    }
});

// ─────────────────────────────────────────────
// 🔑 LOGIN
// ─────────────────────────────────────────────

client.login(config.token);
