const { Client, GatewayIntentBits, ChannelType, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

const VOICE_CHANNEL_ID = "1401074295022817381";
const GUILD_ID = "1367976354104086629";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ]
});

// تسجيل أمر /send
const commands = [
    new SlashCommandBuilder()
        .setName('send')
        .setDescription('ارسال رسالة بالخاص')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('الشخص')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('الرسالة')
                .setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once("ready", async () => {

    console.log(`🔥 ${client.user.tag} is online`);

    await rest.put(
        Routes.applicationGuildCommands(client.user.id, GUILD_ID),
        { body: commands }
    );

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return;

    const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);
    if (!channel || channel.type !== ChannelType.GuildVoice) return;

    const existingConnection = getVoiceConnection(guild.id);
    if (!existingConnection) {
        joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true
        });
    }

});

// تنفيذ الأمر
client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "send") {

        const user = interaction.options.getUser("user");
        const message = interaction.options.getString("message");

        const guild = interaction.guild;

        // لو حددت شخص
        if (user) {

            try {
                await user.send(`${message}\n\n<@${user.id}>`);
                await interaction.reply({ content: "✅ تم ارسال الرسالة", ephemeral: true });
            } catch {
                await interaction.reply({ content: "❌ ما قدرت ارسل له خاص", ephemeral: true });
            }

        } 
        // لو ما حددت شخص (يرسل للكل)
        else {

            await guild.members.fetch();

            guild.members.cache.forEach(member => {
                if (!member.user.bot) {
                    member.send(`${message}\n\n<@${member.id}>`).catch(() => {});
                }
            });

            await interaction.reply({ content: "✅ تم ارسال الرسالة للجميع", ephemeral: true });

        }

    }

});

client.login(process.env.TOKEN);
