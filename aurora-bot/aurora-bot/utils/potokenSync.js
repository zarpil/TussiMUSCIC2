import fetch from 'node-fetch';

export async function syncPoToken(nodeHost = 'nodelink', nodePort = '2333', nodePassword = 'youshallnotpass') {
  try {
    console.log('[PoToken Sync] Fetching new poToken from local provider (http://pot-provider:4416/)...');
    
    // Fetch the token from the pot-provider container
    const res = await fetch('http://pot-provider:4416/', { timeout: 10000 });
    
    if (!res.ok) {
      throw new Error(`Provider returned status ${res.status}`);
    }
    
    const data = await res.json();
    
    // Extract visitorData and poToken (handling common key variations)
    const visitorData = data.visitorData || data.visitor_data || data.visitor || '';
    const poToken = data.poToken || data.po_token || data.token || '';
    
    if (!visitorData || !poToken) {
      throw new Error(`Invalid response format from provider: ${JSON.stringify(data)}`);
    }
    
    console.log('[PoToken Sync] Successfully retrieved tokens. Injecting into NodeLink...');
    
    // Patch NodeLink YouTube Config
    const patchRes = await fetch(`http://${nodeHost}:${nodePort}/v4/youtube/config`, {
      method: 'PATCH',
      headers: {
        'Authorization': nodePassword,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        visitorData: visitorData,
        poToken: poToken
      })
    });
    
    if (patchRes.ok) {
      console.log('[PoToken Sync] NodeLink YouTube configuration updated successfully!');
    } else {
      const errorText = await patchRes.text();
      console.error(`[PoToken Sync] Failed to update NodeLink: ${patchRes.status} - ${errorText}`);
    }
  } catch (error) {
    console.error(`[PoToken Sync] Error syncing poToken:`, error.message);
  }
}

export function schedulePoTokenSync(nodeHost, nodePort, nodePassword) {
  // Wait 10 seconds on startup for NodeLink to be fully ready
  setTimeout(() => {
    syncPoToken(nodeHost, nodePort, nodePassword);
  }, 10000);
  
  // Run every 6 hours (6 * 60 * 60 * 1000)
  setInterval(() => {
    syncPoToken(nodeHost, nodePort, nodePassword);
  }, 21600000);
}
