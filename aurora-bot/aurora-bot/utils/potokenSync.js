import fetch from 'node-fetch';

export async function syncPoToken(nodeHost = 'nodelink', nodePort = '2333', nodePassword = 'youshallnotpass') {
  if (process.env.DISABLE_POT_SYNC === 'true') {
    console.log('[PoToken Sync] Disabled via DISABLE_POT_SYNC environment variable.');
    return;
  }

  const providerUrl = (process.env.POT_PROVIDER_URL || 'http://pot-provider:4416').replace(/\/$/, '');

  try {
    console.log(`[PoToken Sync] Fetching new poToken from local provider (${providerUrl}/get_pot)...`);
    
    // Fetch the token from the pot-provider container
    const res = await fetch(`${providerUrl}/get_pot`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ client: "web" }),
      timeout: 15000 
    }).catch(err => {
      throw new Error(`Servicio de PoToken (${providerUrl}) no alcanzable: ${err.message}`);
    });
    
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Provider returned status ${res.status}: ${errText}`);
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
    console.warn(`[PoToken Sync] ⚠️ Aviso de sincronización poToken: ${error.message}`);
  }
}

export async function schedulePoTokenSync(nodeHost, nodePort, nodePassword) {
  // Run immediately on startup and wait for it
  await syncPoToken(nodeHost, nodePort, nodePassword);
  
  // Run every 6 hours (6 * 60 * 60 * 1000)
  setInterval(() => {
    syncPoToken(nodeHost, nodePort, nodePassword);
  }, 21600000);
}
