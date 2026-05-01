require("dotenv").config();
const fs = require("fs");

const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');

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



client.login(process.env.DISCORD_TOKEN);
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID; // log atılacak kanal


///////////////////////////////////////////////////////////////////////////////
//                   WEB SERVER YAPMA

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot aktif");
});

app.listen(process.env.PORT || 3000);



////////////////////////////////////////////////////////////


// DATTTAAA BASSEEE

let db = {};

// DATABASE YÜKLE

if (fs.existsSync('./database.json')) { db = JSON.parse(fs.readFileSync('./database.json', 'utf8')); }

// DATABASE KAYDET

function saveDB() {
  fs.writeFileSync('./database.json', JSON.stringify(db, null, 2));
}

// 🔧 DB FIX (eksik verileri düzeltir)

for (const id in db) {
  if (typeof db[id].messageXP !== "number") db[id].messageXP = 0;
  if (typeof db[id].voiceXP !== "number") db[id].voiceXP = 0;
}
saveDB();


///////////////////////////////////////////////////////////////////////////////

// SLASH KOMUTU

const commands = [
  new SlashCommandBuilder()
    .setName('xp')
    .setDescription('XP gösterir')


].map(cmd => cmd.toJSON());


/////////////////////////////////////////////////////////////////f//////////////

//  AYARLAR

 // log atılacak kanal

const MESSAGE_XP = 5;        // 💬 mesaj başına XP
const VOICE_XP = 10;         // 🎧 5 dk başına XP
const VOICE_INTERVAL = 5 * 60 * 1000; // 5 dakika

const LEVEL_BASE = 100;      // 🧠 level için gereken XP (örn: 100 = 100 xp 1 level)

//////////// LEVEL

 function getLevel(xp) {
  return Math.floor(xp / LEVEL_BASE);
}


///////////////////////////////////////////////////////////////////////////////

//MESAJ XP SİSTEMİ

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const id = message.author.id;

  if (!db[id]) db[id] = { messageXP: 0, voiceXP: 0 };

  const oldLevel = getLevel(db[id].messageXP);

  db[id].messageXP += MESSAGE_XP;

  const newLevel = getLevel(db[id].messageXP);

  saveDB();

  if (newLevel > oldLevel) {
    message.channel.send(`💬 <@${id}> mesaj level atladı! (${newLevel})`);
  }
});

///////////////

//VOICE XP + LOG SİSTEMİ

const voiceUsers = new Map();
const pendingSave = new Set();

client.on("voiceStateUpdate", (oldState, newState) => {

  const userId = newState.id;
  const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);

  //  GİRİŞ
  if (!oldState.channelId && newState.channelId) {
    
    if (!db[userId]) db[userId] = { messageXP: 0, voiceXP: 0 };

    const time = new Date().toLocaleTimeString();

      if (logChannel) {
    logChannel.send({
      embeds: [{
        color: 0x2b2d31,
        author: {
          name: newState.member.user.username,
          icon_url: newState.member.user.displayAvatarURL()
        },
        description: `**<@${userId}> ses kanalına sikişerek girdi. **`,
        fields: [
          {
            name: "Giriş",
            value: `\`${newState.channel.name}\``
          }
        ],
        footer: {
          text: "Wild Claw •  " + new Date().toLocaleTimeString("tr-TR")
        }
      }]
    });
  }
}
///////////////////////////////////////

//////////////////////////////////////

  const joined = !oldState.channelId && newState.channelId;
  const left = oldState.channelId && !newState.channelId;

  if (!db[userId]) db[userId] = { messageXP: 0, voiceXP: 0 };

  // GİRİŞ
  if (joined) {
    if (voiceUsers.has(userId)) {
      clearInterval(voiceUsers.get(userId));
    }

    const interval = setInterval(() => {
      const channel = newState.channel;
      if (!channel) return;

      const oldLevel = getLevel(db[userId].voiceXP);

      // 🎯 5 dk = 10 XP
      db[userId].voiceXP += 10;

      const newLevel = getLevel(db[userId].voiceXP);

      pendingSave.add(userId);

      if (newLevel > oldLevel) {
        const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
        if (logChannel) {
          logChannel.send(`🎉 <@${userId}> voice level atladı! (${newLevel})`);
        }
      }

    }, 5 * 60 * 1000); // 5 dakika

    voiceUsers.set(userId, interval);
  }

  // ÇIKIŞ
  if (left) {
    const interval = voiceUsers.get(userId);
    if (interval) clearInterval(interval);

    voiceUsers.delete(userId);
  }

  //  ÇIKIŞ
  if (oldState.channelId && !newState.channelId) {

    const time = new Date().toLocaleTimeString();

  if (logChannel) {
    logChannel.send({
      embeds: [{
        color: 0x2b2d31,
        author: {
          name: newState.member.user.username,
          icon_url: newState.member.user.displayAvatarURL()
        },
        description: `**<@${userId}> ses kanalına götten yiyerek çıktı. **`,
        fields: [
          {
            name: "Çıkış",
            value: `\`${oldState.channel.name}\``
          }
        ],
        footer: {
          text: "Wild Claw •  " + new Date().toLocaleTimeString("tr-TR")
        }
      }]
    });
  }
}
  //  KANAL DEĞİŞTİRME
if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {

   const time = new Date().toLocaleTimeString();
   
  if (logChannel) {
    logChannel.send({
      embeds: [{
        color: 0x2b2d31,
        author: {
          name: newState.member.user.username,
          icon_url: newState.member.user.displayAvatarURL()
        },
        description: `**<@${userId}> yalakalık yapmak için oda değiştirdi.!**`,
        fields: [
          {
            name: "Geçiş",
            value: `\`${oldState.channel.name}\` ➝ \`${newState.channel.name}\``
          }
        ],
        footer: {
          text: "Wild Claw • " + new Date().toLocaleTimeString("tr-TR")
        }
      }]
    });
  }
};
});
//////////////////////////

/////////// XP KOMUTU

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "xp") {
    const data = db[interaction.user.id] || { messageXP: 0, voiceXP: 0 };

    const msgLevel = getLevel(data.messageXP);
    const voiceLevel = getLevel(data.voiceXP);

    await interaction.reply(
      
`💬 Mesaj: ${data.messageXP} XP | Lv: ${msgLevel}
🎧 Ses: ${data.voiceXP} XP | Lv: ${voiceLevel}`
    );
  }
})


////////////////////////////////////

////

// dB OPTİMİZE KAYIT SİSTEMİ

setInterval(() => {
  if (pendingSave.size === 0) return;

  saveDB(); // tek seferde kaydeder
  pendingSave.clear();

  console.log("💾 DB kaydedildi (batch)");
}, 30000); // 30 saniyede 1 kayıt


//////////////////////////

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot aktif");
});

app.listen(3000, () => console.log("Web server çalışıyor"));