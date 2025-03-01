<script lang="ts">
import type { AppClient, HolochainError } from "@holochain/client";
import { AppWebsocket } from "@holochain/client";
import { onMount, setContext } from "svelte";
import { type ClientContext, clientContext } from "./contexts";
import Banner from './Banner.svelte'
import NavBar from './NavBar.svelte'

import SearchRooms from './chatroom/premade-chatroom/SearchRooms.svelte';
import YourRooms from './chatroom/premade-chatroom/YourRooms.svelte';
import Conversation from './chatroom/premade-chatroom/Conversation.svelte';
import { currentRoute } from './stores/navigation';

// State tracking
let client: AppClient | undefined;
let error: HolochainError | undefined;
let initializing = true;

// Simple client cache to ensure we only initialize once
let clientCache: AppClient | null = null;
let clientInitPromise: Promise<AppClient> | null = null;

// Simple implementation of client provider
const appClientContext = {
  getClient: async () => {
    // If we already have a client, return it
    if (clientCache) {
      return clientCache;
    }
    
    // If we're already initializing, wait for that to complete
    if (clientInitPromise) {
      return clientInitPromise;
    }
    
    // Start new initialization
    clientInitPromise = (async () => {
      try {
        const newClient = await AppWebsocket.connect();
        clientCache = newClient;
        return newClient;
      } catch (e) {
        clientInitPromise = null; // Reset so we can try again
        throw e;
      }
    })();
    
    return clientInitPromise;
  },
  
  ensureClientReady: async () => {
    try {
      // Get the client (creates if needed)
      const appClient = await appClientContext.getClient();
      
      // Check if myPubKey is available
      if (!appClient.myPubKey) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check again, and if still not available, try reconnecting
        if (!appClient.myPubKey) {
          clientCache = null; // Clear cache so we create a new client 
          clientInitPromise = null;
          return await appClientContext.getClient(); // This will create a new client
        }
      }
      
      return appClient;
    } catch (e) {
      clientInitPromise = null; // Reset so we can try again
      throw e;
    }
  }
};

// Set the context immediately so it's available to child components
setContext<ClientContext>(clientContext, appClientContext);

// Handle initialization in onMount
onMount(async () => {
  try {
    // Show initializing state for at least 1 second
    const startTime = Date.now();
    
    // Connect to the client
    client = await appClientContext.ensureClientReady();
    
    // Ensure loading screen shows for at least 1 second
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - elapsedTime));
    }
    
  } catch (e) {
    error = e as HolochainError;
    console.error("Error initializing client:", e);
  } finally {
    // Only turn off initializing when we're done with all steps
    initializing = false;
  }
});

</script>

<Banner challengeName={'Scaffolding and Signals'} challengeNumber={4}>
  <div>
    {#if initializing}
      <div 
        style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;"
      >
        <p>Initializing Holochain connection...</p>
        <p style="color: #777; font-size: 0.9em;">This may take a moment on first load</p>
      </div>
    {:else if client}
      <NavBar />
      <div
        id="content"
        style="max-width: 400px; margin-left: auto; margin-right: auto; display: flex; flex-direction: column; flex: 1; justify-content: center; gap: 20px;"
      >
        {#if $currentRoute.path === '/search'}
          <SearchRooms
            on:room-created={(e) => currentRoute.set({ path: '/conversation', params: { roomHash: e.detail.roomHash }})}
            on:room-joined={(e) => currentRoute.set({ path: '/conversation', params: { roomHash: e.detail.roomHash }})}
          />
        {:else if $currentRoute.path === '/rooms'}
          <YourRooms
            openChatRoom={(roomHash) => currentRoute.set({ path: '/conversation', params: { roomHash }})}
          />
        {:else if $currentRoute.path === '/conversation' }
          <Conversation  />
        {/if}
      </div>
    {:else}
      <div 
        style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;"
      >
        <h3>Connection Error</h3>
        <p style="color: #555; text-align: center; max-width: 400px; margin: 10px auto;">
          Could not connect to the Holochain conductor. This is common on first startup.
        </p>
        <p style="color: #777; font-size: 0.9em; text-align: center; max-width: 400px; margin: 5px auto;">
          The conductor needs more time to initialize. Please reload the page.
        </p>
        <button 
          style="background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-top: 15px; font-weight: bold;"
          on:click={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    {/if}
  </div>
</Banner>
