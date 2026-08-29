import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { ClusterClient, getInfo } from 'discord-hybrid-sharding';
import 'dotenv/config';
export default class MainClient extends Client {
  constructor() {
    super({
      shards: getInfo().SHARD_LIST,
      shardCount: getInfo().TOTAL_SHARDS,
      failIfNotExists: true,
      allowedMentions: {
        parse: ['roles', 'users', 'everyone'],
        repliedUser: false,
      },
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    });
    this.cluster = new ClusterClient(this);
  }
   async connect() {
    return this.login(process.env.BOT_TOKEN);
  }
}