import { ClusterManager } from "discord-hybrid-sharding";
import 'dotenv/config';
import { tick_emoji } from "./emoji/emoji.js";

const manager = new ClusterManager("./aurora.js", {
    totalShards: "auto",
    shardsPerClusters: 2,
    totalClusters: "auto",
    mode: "process",
    respawn: true,
    token: process.env.BOT_TOKEN,
});
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('clientReady')) {
    return;
  }
  console.warn(warning.name, warning.message);
});

manager.on("clusterCreate", async(cluster) =>{
    try{
  const send ={
        embeds: [{
            title: `Cluster Create`,
            color: 3066993,
            description:`${tick_emoji} Launched cluster ${cluster.id}`,
            footer: {
                text: "Powered by Skyline Studio"
            },
            timestamp: new Date().toISOString()
        }]
    };
     await fetch(process.env.WEBHOOK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(send),
            });
    }
    catch(err)
        {
            console.log(err)
        }
});
manager.spawn({ timeout: -1 });