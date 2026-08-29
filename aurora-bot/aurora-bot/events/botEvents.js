export async function botEvents(client) {
    
client.on('error', (error) => {
  console.error('❌ Client error:', error);
});

client.on('shardError', (error) => {
  console.error('❌ Shard error:', error);
});

client.on('disconnect', (event) => {
  console.warn('⚠️ Bot disconnected:', event);
});

client.on('reconnecting', () => {
  console.log('🔄 Bot is reconnecting...');
});

process.on('unhandledRejection', (reason, promise) => {
  if (
    reason instanceof TypeError &&
    reason.message.includes("reading 'options'")
  ) {
    // Silently ignore this specific error
    return;
  }
  console.error('🚨 Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught exception:', err);
});
}