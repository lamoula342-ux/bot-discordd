const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');
require('dotenv').config();

const STAFF_ROLES = ['| Moderator', '| Game Admin', '| Senior Admin'];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});


// ─────────────── SETUP COMMAND ───────────────
client.on('messageCreate', async message => {
  if (!message.content.startsWith('!')) return;
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

  if (message.content === '!ticket-setup') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_ticket')
        .setLabel('🎫 Create Ticket')
        .setStyle(ButtonStyle.Primary)
    );

    message.channel.send({
      embeds: [{
        color: 0x2f3136,
        title: 'Support',
        description: 'Clique sur le bouton pour créer un ticket',
        footer: { text: 'Ticket System' }
      }],
      components: [row]
    });
  }
});


// ─────────────── INTERACTIONS ───────────────
client.on('interactionCreate', async interaction => {

  // OPEN TICKET
  if (interaction.isButton() && interaction.customId === 'open_ticket') {

    const name = `ticket-${interaction.user.username.toLowerCase()}`;

    if (interaction.guild.channels.cache.find(c => c.name === name))
      return interaction.reply({ ephemeral: true, content: '❌ Tu as déjà un ticket ouvert.' });

    const staffPerms = STAFF_ROLES.map(r => {
      const role = interaction.guild.roles.cache.find(x => x.name === r);
      return role ? { id: role.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] } : null;
    }).filter(Boolean);

    const channel = await interaction.guild.channels.create({
      name,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ...staffPerms
      ]
    });

    const controls = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('claim_ticket').setLabel('👑 CLAIM').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 FERMER').setStyle(ButtonStyle.Danger)
    );

    channel.send({
      content: `<@${interaction.user.id}>`,
      embeds: [{
        color: 0x5865F2,
        description: 'Un staff va te prendre en charge.'
      }],
      components: [controls]
    });

    interaction.reply({ ephemeral: true, content: `✅ Ticket créé : ${channel}` });
  }

  // CLAIM TICKET
  if (interaction.isButton() && interaction.customId === 'claim_ticket') {
    const mod = interaction.member.displayName.toLowerCase().replace(/ /g, '');
    await interaction.channel.setName(`claimed-${mod}`);
    return interaction.reply({ ephemeral: true, content: '👑 Ticket claim avec succès.' });
  }

  // CLOSE TICKET
  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    await interaction.reply({ ephemeral: true, content: '🔒 Fermeture du ticket...' });
    setTimeout(() => interaction.channel.delete(), 3000);
  }
});

client.login(process.env.TOKEN);
