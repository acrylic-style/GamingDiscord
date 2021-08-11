const Discord = require('discord.js')
const { LoggerFactory } = require('logger.js')
const env = require('dotenv-safe').config().parsed
const client = new Discord.Client({ intents: Discord.Intents.FLAGS.GUILD_MESSAGES | Discord.Intents.FLAGS.GUILDS })
const logger = LoggerFactory.getLogger('client', 'green')

// const DISCORD_BACKGROUND_COLOR = 0x36393f

// these colors are just bad (hard to see)
// #000000 is used as default color
const bannedColors = [0x000000, 0x333333, 0x333366]

client.on('ready', () => {
  logger.info(`Logged in as ${client.user.tag}!`)
})

client.on('messageCreate', async msg => {
  if (msg.system || msg.author.system || msg.author.bot) return
  if (msg.content === `<@${client.user.id}>` || msg.content === `<@!${client.user.id}>`) {
    const embed = new Discord.MessageEmbed()
    embed.setDescription('gg')
    embed.setColor('GREEN')
    embed.setTitle('コマンド')
    embed.addField('/color <RGB>', '色を設定します。指定した色が使用できない場合は一番近い色に設定されます。')
    if (msg.member.permissions.has(8)) {
      embed.addField('/setup', 'すごい染料を作成します。')
      embed.addField('/removeall', 'すごい染料をすべて削除します。')
    }
    msg.reply({ embeds: [embed] })
    return
  }
  const args = msg.content.split(/\s+/)
  if (args[0] === '/color') {
    let color = parseInt(args[1], 10)
    if (isNaN(color)) {
      color = parseInt(args[1], 16)
    }
    if (isNaN(color)) return
    const roles = (await msg.guild.roles.fetch()).filter(role => role.name === 'すごい染料')
    roles.sort((a, b) => Math.abs(color - a.color) - Math.abs(color - b.color))
    msg.member.roles.add(roles[0])
    const embed = new Discord.MessageEmbed()
    embed.setColor(color)
    embed.setTitle('')
    embed.setDescription(`色を${color.toString(16)}に設定しました。`)
    msg.reply({ embeds: [embed] })
  } else if (msg.member.permissions.has(8) && args[0] === '/setup') {
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
  } else if (msg.member.permissions.has(8) && args[0] === '/removeall') {
    const roles = await msg.guild.roles.fetch()
    await Promise.all(roles.filter(role => role.name === 'すごい染料').map(role => role.delete()))
    msg.reply('染料ロールをすべて削除しました。')
  }
})

client.login(env.TOKEN)
