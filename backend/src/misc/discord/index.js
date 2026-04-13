const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder, ActivityType, MessageFlags, PermissionFlagsBits } = require('discord.js');
const WebSocket = require('ws');
const { createLocalChatServer } = require('./chat-server');

// -------- CONFIG --------
const IP = '187.77.235.159';
const RCON_PORT = 28017;
const RCON_PASSWORD = process.env.RCON_PASSWORD || '';
const TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const CLIENT_ID = '1489812355511619756';
const GUILD_ID = '1489484782525218826';
const MAX_PLAYERS = 150;

// 🆔 CANAL DE CHAT
const CHAT_CHANNEL_ID = '1490179070225420432'; 

// 🆔 LISTA DE IDs AUTORIZADOS
const ADMIN_IDS = [
        '765999555312353280',
        '292854749395681281',
        '355584139514085378',
        '433719940135256074',
        '285263585930903562'
];

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});

let localHttpServerStarted = false;

// ==========================
// CLASE RCON PERSISTENTE
// ==========================
class RustRcon {
    constructor() {
        this.ws = null;
        this.playerCount = 0;
        this.playersList = [];
        this.connected = false;
    }

    connect() {
        this.ws = new WebSocket(`ws://${IP}:${RCON_PORT}/${RCON_PASSWORD}`);
        
        this.ws.on('open', () => {
            this.connected = true;
            console.log("✅ RCON Conectado");
            this.updateData();
        });

        this.ws.on('message', (data) => {
            try {
                const res = JSON.parse(data);
                if (res.Identifier === 1 && res.Message) this.parseStatus(res.Message);

                if (res.Type === "Chat") {
                    const chatObj = JSON.parse(res.Message);
                    if (chatObj.Username === "Server" || chatObj.Username === "Console") return;

                    const channel = client.channels.cache.get(CHAT_CHANNEL_ID);
                    if (channel) {
                        channel.send(`**[RUST] ${chatObj.Username}:** ${chatObj.Message}`);
                    }
                }
            } catch (e) {
                if (typeof data === 'string' && data.includes("[CHAT]")) {
                    const channel = client.channels.cache.get(CHAT_CHANNEL_ID);
                    if (channel) channel.send(`\`${data}\``);
                }
            }
        });

        this.ws.on('close', () => {
            this.connected = false;
            console.log("⚠️ Conexión perdida. Reintentando...");
            setTimeout(() => this.connect(), 5000);
        });

        this.ws.on('error', (err) => console.error("❌ Error RCON:", err.message));
    }

    updateData() {
        if (this.connected) this.ws.send(JSON.stringify({ Identifier: 1, Message: "status", Name: "WebRcon" }));
    }

    parseStatus(message) {
        const regex = /(\d+)\s+"([^"]+)"\s+(\d+)\s+([\d.]+s)/g;
        let match;
        let count = 0;
        const list = [];
        while ((match = regex.exec(message)) !== null) {
            count++;
            list.push(`• ${match[2]} (${match[3]} ms)`);
        }
        this.playerCount = count;
        this.playersList = list;
    }

    sendCommand(cmd) {
        if (!this.connected) return;
        this.ws.send(JSON.stringify({ Identifier: 100, Message: cmd, Name: "WebRcon" }));
    }
}

const rcon = new RustRcon();
rcon.connect();

// ==========================
// REGISTRO DE COMANDOS
// ==========================
const commands = [
    new SlashCommandBuilder().setName('players').setDescription('Lista de jugadores'),
    new SlashCommandBuilder().setName('say').setDescription('Enviar anuncio oficial (Solo Admins)')
        .addStringOption(o => o.setName('mensaje').setDescription('Texto del anuncio').setRequired(true))
].map(c => c.toJSON());

if (TOKEN) {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    (async () => {
        try { await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands }); } catch (e) { console.error(e); }
    })();
} else {
    console.warn('DISCORD_BOT_TOKEN no configurado. Se omite el registro de comandos.');
}

// ==========================
// EVENTOS DISCORD
// ==========================

client.once('clientReady', (c) => {
    console.log(`🤖 Bot listo: ${c.user.tag}`);

    if (!localHttpServerStarted) {
        createLocalChatServer({ client, channelId: CHAT_CHANNEL_ID, rcon });
        localHttpServerStarted = true;
    }

    setInterval(() => {
        rcon.updateData();
        client.user.setPresence({
            activities: [{ name: `${rcon.playerCount}/${MAX_PLAYERS} jugadores`, type: ActivityType.Playing }],
            status: rcon.connected ? 'online' : 'dnd',
        });
    }, 30000);
});


// Bridge (Discord -> Rust)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== CHAT_CHANNEL_ID) return;

    // Verificamos si el autor es Admin
    if (ADMIN_IDS.includes(message.author.id)) {
        // SI ES ADMIN: Se manda limpio y en mayúsculas
        rcon.sendCommand(`say "${message.content.toUpperCase()}"`);
    } else {
        // SI NO ES ADMIN: Respondemos al mensaje avisando que no tiene permiso
        try {
            const reply = await message.reply(`❌ **No tienes permisos para enviar mensajes al servidor de Rust.**`);
            
            // Opcional: Borrar el mensaje del usuario y la advertencia después de 5 segundos para mantener el canal limpio
            setTimeout(() => {
                message.delete().catch(() => {});
                reply.delete().catch(() => {});
            }, 5000);
        } catch (err) {
            console.error("Error al responder o borrar mensaje:", err);
        }
    }
});
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'players') {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ PAJARITOS RUST | STATUS')
            .addFields(
                { name: '👥 Jugadores', value: `${rcon.playerCount} / ${MAX_PLAYERS}`, inline: true },
                { name: '🟢 Online', value: rcon.playersList.length ? rcon.playersList.join('\n') : 'Nadie online', inline: false }
            )
            .setColor(0x1F8B4C);
        return await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'say') {
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return await interaction.reply({ 
                content: `❌ **Error de permisos.**`, 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        const msg = interaction.options.getString('mensaje');
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            rcon.sendCommand(`say "SERVER: ${msg.toUpperCase()}"`);
            await interaction.editReply(`✅ Anuncio enviado como SERVER.`);
        } catch (err) {
            await interaction.editReply(`❌ Error al conectar.`);
        }
    }
});

client.login(TOKEN);
