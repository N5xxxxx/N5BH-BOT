const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');

const TOKEN = "MTQ3MzMxNjI1ODY2MDM1NjI0MA.Gfis0U.NKk71RSKsxu3VrUCEcZJ7H9ziD6Q-s6w6ViKWQ";
const VOICE_CHANNEL_ID = "1401074295022817381";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

let connection;

async function connectToVoice(guild) {
    const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);
    if (!channel || channel.type !== ChannelType.GuildVoice) {
        console.log("❌ Voice channel invalid");
        return;
    }

    connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true
    });

    console.log("🎧 Connected to voice channel");

    connection.on("stateChange", async (_, newState) => {
        if (newState.status === VoiceConnectionStatus.Disconnected) {
            console.log("⚠ Disconnected... Reconnecting");
            try {
                await entersState(connection, VoiceConnectionStatus.Connecting, 5000);
            } catch {
                connection.destroy();
                connectToVoice(guild);
            }
        }
    });
}

client.once("ready", async () => {
    console.log(`🔥 ${client.user.tag} is online`);
    const guild = client.guilds.cache.first();
    if (!guild) return;

    await connectToVoice(guild);
});

client.on("voiceStateUpdate", (oldState, newState) => {
    if (!client.user) return;

    // إذا أحد سحب البوت لروم ثاني
    if (newState.id === client.user.id) {
        if (newState.channelId !== VOICE_CHANNEL_ID) {
            console.log("🚨 Bot was moved! Returning...");
            const guild = newState.guild;
            connectToVoice(guild);
        }
    }

    // إذا أحد حاول يطلعه
    if (oldState.id === client.user.id && !newState.channelId) {
        console.log("🚨 Bot was disconnected! Rejoining...");
        const guild = oldState.guild;
        connectToVoice(guild);
    }
});

client.login("MTQ3MzMxNjI1ODY2MDM1NjI0MA.Gfis0U.NKk71RSKsxu3VrUCEcZJ7H9ziD6Q-s6w6ViKWQ");