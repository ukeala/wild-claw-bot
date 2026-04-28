const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('clientReady', () => {
  console.log(`Bot hazır: ${client.user.tag}`);
});

////////////////////////////////////////////////////////


require("dotenv").config();

client.login(process.env.DISCORD_TOKEN);


///////////////////////////////////////////////////////////////////////////////
//                   WEB SERVER YAPMA

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot aktif");
});

app.listen(process.env.PORT || 3000);



////////////////////////////////////////////////////////////


// XP YERLERİ

const voiceSessions = new Map();

client.on('voiceStateUpdate', (oldState, newState) => {
  const userId = newState.id;

  if (!oldState.channel && newState.channel) {
    voiceSessions.set(userId, {
      channel: newState.channelId
    });
  }

  if (oldState.channel && !newState.channel) {
    voiceSessions.delete(userId);
  }
});

setInterval(() => {
  for (const [userId, session] of voiceSessions) {

    if (!db[userId]) {
      db[userId] = { xp: 0, lastReward: Date.now() };
    }

    const now = Date.now();
    const diff = now - db[userId].lastReward;

    // 5 dakika = 300000 ms
    if (diff >= 300000) {

      const cycles = Math.floor(diff / 300000);

      const gain = cycles * 10; // 5 dakika = 10 XP

      db[userId].xp += gain;
      db[userId].lastReward = now;

      console.log(`${userId} +${gain} XP (5 min batch)`);
    }
  }

  fs.writeFileSync('./database.json', JSON.stringify(db, null, 2));
}, 60000);




///////////////////////////////////////////////////////////////////////////////

// DATTTAAA BASSEEE

const fs = require('fs');

let db = {};

// database yükle

if (fs.existsSync('./database.json')) {
  db = JSON.parse(fs.readFileSync('./database.json', 'utf8'));
}



///////////////////////////////////////////////////////////////////////////////



// !XP SİSTEMİ

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  if (message.content === '!xp') {
    const userId = message.author.id;

    // kullanıcı yoksa 0 yap
    if (!db[userId]) {
  db[userId] = {
    xp: 0,
    lastReward: Date.now()
  };
}

     message.reply(`🎧 **XP:  **${db[userId].xp}`);
  }
});

///////////////////////////////////////////////////////////////////////////////


///                  LEADER BOT OW YEAH


const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('XP leaderboard gösterir')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands("CLIENT_ID_BURAYA"),
      { body: commands }
    );
    console.log("Slash komut yüklendi");
  } catch (err) {
    console.error(err);
  }
})();

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'leaderboard') {

    const medals = ["🥇", "🥈", "🥉"];
    const getLevel = (xp) => Math.floor(xp / 100);

    const leaderboard = Object.entries(db)
      .sort((a, b) => b[1].xp - a[1].xp)
      .slice(0, 10);

    const description = leaderboard.map((user, i) => {
      const medal = medals[i] || `\`${i + 1}\``;
      const xp = user[1].xp;
      const level = getLevel(xp);

      return `${medal} <@${user[0]}> - Seviye ${level} (${xp} XP)`;
    }).join("\n");

    await interaction.reply(description || "Boş");
  }
});