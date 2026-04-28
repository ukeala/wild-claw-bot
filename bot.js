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



client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // !leaderboard komutu
  if (message.content === "!leaderboard") {

    const medals = ["🥇", "🥈", "🥉"];

    const getLevel = (xp) => Math.floor(xp / 100);

    const leaderboard = Object.entries(db)
      .filter(u => u[1] && typeof u[1].xp === "number")
      .sort((a, b) => b[1].xp - a[1].xp)
      .slice(0, 10);

    const description = leaderboard.length
      ? leaderboard.map((user, i) => {
          const medal = medals[i] || `\`${i + 1}\``;
          const xp = user[1].xp;
          const level = getLevel(xp);

          return `${medal} **<@${user[0]}>**
> 🏅 Seviye: \`${level}\`
> 💎 XP: \`${xp.toLocaleString()}\``;
        }).join("\n\n")
      : "❌ Leaderboard boş!";

    const embed = new EmbedBuilder()
      .setTitle("🐺 WILD CLAW LEADERBOARD")
      .setDescription(description)
      .setColor("#6a00ff")
      .setFooter({ text: "🔥 Vahşi olan zirvede kalır" })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
});
