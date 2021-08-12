const Discord = require('discord.js')
const { LoggerFactory } = require('logger.js')
const env = require('dotenv-safe').config().parsed
const client = new Discord.Client({
  intents: Discord.Intents.FLAGS.GUILD_MESSAGES | Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS | Discord.Intents.FLAGS.GUILDS | Discord.Intents.FLAGS.GUILD_MEMBERS,
})
const logger = LoggerFactory.getLogger('client', 'green')

// const DISCORD_BACKGROUND_COLOR = 0x36393f

// these colors are just bad (hard to see)
// #000000 is used as default color
const bannedColors = [0x000000, 0x444444]

const emojis = {
  arrow_backward: '◀️',
  one: '1️⃣',
  two: '2️⃣',
  three: '3️⃣',
  four: '4️⃣',
  five: '5️⃣',
  six: '6️⃣',
  seven: '7️⃣',
  eight: '8️⃣',
  nine: '9️⃣',
  ten: '🔟',
  arrow_forward: '▶️',
}

const zero = (length, o) => {
  const s = String(o)
  if (s.length >= length) return s
  return '0'.repeat(length - s.length) + s
}

const diffColor = (color, another) => {
  const r1 = (color >> 16) & 0xFF
  const g1 = (color >> 8) & 0xFF
  const b1 = color & 0xFF
  const r2 = (another >> 16) & 0xFF
  const g2 = (another >> 8) & 0xFF
  const b2 = another & 0xFF
  return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)
}

client.on('ready', () => {
  logger.info(`Logged in as ${client.user.tag}!`)
})

client.on('messageCreate', async msg => {
  if (msg.system || msg.author.system || msg.author.bot) return
  if (msg.content === `<@${client.user.id}>` || msg.content === `<@!${client.user.id}>`) {
    const embed = new Discord.MessageEmbed()
    embed.setColor('GREEN')
    embed.setTitle('コマンド')
    embed.addField('/set <RGB>', '色を設定します。指定した色が使用できない場合は一番近い色に設定されます。')
    embed.addField('/color [RGB]', '色を設定します。')
    if (msg.member.permissions.has(8)) {
      embed.addField('/setup', 'すごい染料を作成します。')
      embed.addField('/removeall', 'すごい染料をすべて削除します。')
    }
    msg.reply({ embeds: [embed] })
    return
  }
  const args = msg.content.split(/\s+/)
  if (args[0] === '//set') {
    let color = parseInt(args[1], 16)
    if (isNaN(color)) {
      color = parseInt(args[1], 10)
    }
    if (isNaN(color)) return
    const roles = (await msg.guild.roles.fetch()).filter(role => role.name === 'すごい染料')
    roles.sort((a, b) => diffColor(color, a.color) - diffColor(color, b.color))
    await msg.member.fetch()
    await msg.member.roles.remove(msg.member.roles.cache.filter(role => role.name === 'すごい染料'))
    await msg.member.roles.add(roles.first())
    const embed = new Discord.MessageEmbed()
    embed.setColor(roles.first().color)
    embed.setTitle('すごい染料')
    embed.setDescription(`色を${zero(6, roles.first().color.toString(16))}に設定しました。`)
    msg.reply({ embeds: [embed] })
  } else if (args[0] === '//color') {
    if (args.length === 1) args[1] = '000000'
    let color = parseInt(args[1], 16)
    if (isNaN(color)) {
      color = parseInt(args[1], 10)
    }
    if (isNaN(color)) return
    const roles = (await msg.guild.roles.fetch()).filter(role => role.name === 'すごい染料')
    roles.sort((a, b) => diffColor(color, a.color) - diffColor(color, b.color))
    const embed = new Discord.MessageEmbed()
    embed.setColor(color)
    embed.setTitle(`すごい染料 (1)`)
    embed.footer = { text: msg.author.tag }
    const values = roles.values()
    for (let i = 0; i < 10; i++) {
      const role = values.next().value
      embed.addField(`${i + 1}. #${zero(6, role.color.toString(16))}`, `<@&${role.id}>`)
    }
    const message = await msg.reply({ embeds: [embed], failIfNotExists: false })
    message.react(emojis.arrow_backward)
    message.react(emojis.one)
    message.react(emojis.two)
    message.react(emojis.three)
    message.react(emojis.four)
    message.react(emojis.five)
    message.react(emojis.six)
    message.react(emojis.seven)
    message.react(emojis.eight)
    message.react(emojis.nine)
    message.react(emojis.ten)
    message.react(emojis.arrow_forward)
  } else if (msg.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_ROLES) && args[0] === '//setup') {
    const roles = await msg.guild.roles.fetch()
    if (250 - roles.size < 123) {
      msg.reply(`ロール数の空きが123個必要です。(あと${123 - (250 - roles.size)}個)`)
      return
    }
    const arr = ['0', '4', '8', 'c', 'f']
    const promises = []
    arr.forEach(sr => {
      arr.forEach(sg => {
        arr.forEach(sb => {
          const color = parseInt(`${sr}${sr}${sg}${sg}${sb}${sb}`, 16)
          if (!bannedColors.includes(color)) {
            promises.push(msg.guild.roles.create({ name: 'すごい染料', color: color }))
          }
        })
      })
    })
    logger.info(`Attempting to create ${promises.length} roles`)
    await Promise.all(promises)
    msg.reply('ロールの作成が完了しました。')
  } else if (msg.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_ROLES) && args[0] === '//removeall') {
    const roles = await msg.guild.roles.fetch()
    await Promise.all(roles.filter(role => role.name === 'すごい染料').map(role => role.delete()))
    msg.reply('染料ロールをすべて削除しました。')
  }
})

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot || user.system) return
  if (reaction.message.author.id !== client.user.id) return
  if (reaction.message.embeds.length === 0) return
  const embed = reaction.message.embeds[0]
  if (!embed.title.startsWith('すごい染料 (')) return
  if (embed.fields.length === 0) return
  reaction.users.remove(user)
  let index = -1
  if (reaction.emoji.name === emojis.arrow_backward) index = -2
  if (reaction.emoji.name === emojis.one) index = 0
  if (reaction.emoji.name === emojis.two) index = 1
  if (reaction.emoji.name === emojis.three) index = 2
  if (reaction.emoji.name === emojis.four) index = 3
  if (reaction.emoji.name === emojis.five) index = 4
  if (reaction.emoji.name === emojis.six) index = 5
  if (reaction.emoji.name === emojis.seven) index = 6
  if (reaction.emoji.name === emojis.eight) index = 7
  if (reaction.emoji.name === emojis.nine) index = 8
  if (reaction.emoji.name === emojis.ten) index = 9
  if (reaction.emoji.name === emojis.arrow_forward) index = -3
  if (index === -1) return
  let page = parseInt(embed.title.replace(/.*\((\d+)\)/, '$1'))
  const originalColor = embed.color
  const roles = (await reaction.message.guild.roles.fetch()).filter(role => role.name === 'すごい染料')
  // duplicate code? i don't care.
  if (index === -2) {
    // backward
    if (embed.footer.text !== user.tag) return
    if (page <= 1) return
    roles.sort((a, b) => diffColor(originalColor, a.color) - diffColor(originalColor, b.color))
    page--
    const values = roles.values()
    const e = new Discord.MessageEmbed()
    e.setColor(originalColor)
    e.setTitle(`すごい染料 (${page})`)
    e.footer = embed.footer
    let o = 0
    for (let i = 0; i < 10 * page; i++) {
      const role = values.next().value
      if (!role) break
      if (i >= 10 * (page - 1)) {
        e.addField(`${++o}. #${zero(6, role.color.toString(16))}`, `<@&${role.id}>`)
      }
    }
    reaction.message.edit({ embeds: [e] })
    return
  }
  if (index === -3) {
    // forward
    if (embed.footer.text !== user.tag) return
    if (page >= 13) return
    roles.sort((a, b) => diffColor(originalColor, a.color) - diffColor(originalColor, b.color))
    page++
    const values = roles.values()
    const e = new Discord.MessageEmbed()
    e.setColor(originalColor)
    e.setTitle(`すごい染料 (${page})`)
    e.footer = embed.footer
    let o = 0
    for (let i = 0; i < 10 * page; i++) {
      const role = values.next().value
      if (!role) break
      if (i >= 10 * (page - 1)) {
        e.addField(`${++o}. #${zero(6, role.color.toString(16))}`, `<@&${role.id}>`)
      }
    }
    reaction.message.edit({ embeds: [e] })
    return
  }
  if (!embed.fields[index]) return
  const color = parseInt(embed.fields[index].name.replace(/.*#(.*)/, '$1'), 16)
  const member = await reaction.message.guild.members.fetch(user.id)
  await member.roles.remove(member.roles.cache.filter(role => role.name === 'すごい染料'))
  roles.sort((a, b) => diffColor(color, a.color) - diffColor(color, b.color))
  await member.roles.add(roles.first())
  const e = new Discord.MessageEmbed()
  e.setColor(roles.first().color)
  e.setTitle('すごい染料')
  e.setDescription(`色を${zero(6, roles.first().color.toString(16))}に設定しました。`)
  reaction.message.channel.send({ content: `<@${user.id}>`, embeds: [e] })
})

logger.info('Hello! Please turn on "server members intent" on your bot page if you haven\'t done so already!')
logger.info('Logging in...')
client.login(env.TOKEN)
