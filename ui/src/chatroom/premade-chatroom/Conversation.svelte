<script lang="ts">
  import Message from './Message.svelte'
  import { getContext, onMount } from 'svelte'
  import CreateMessage from './CreateMessage.svelte'
  import {
    encodeHashToBase64,
    SignalType,
    type ActionHash,
    type AppClient,
    type Link,
  } from '@holochain/client'
  import { type ClientContext, clientContext } from "../../contexts";
  import type { ChatroomSignal } from '../../types'

  let client: AppClient;
  const appClientContext = getContext<ClientContext>(clientContext);

  import { currentRoute } from '../../stores/navigation'
  import { decodeHashFromBase64 } from '@holochain/client'
  
  let roomHash: ActionHash | undefined
  let hashes: Array<ActionHash> = []
  let error: any = undefined
  let loading = true

  onMount(async () => {
    client = await appClientContext.getClient();
    
    console.log($currentRoute.roomHash);
    if ($currentRoute.roomHash) {
      roomHash = decodeHashFromBase64($currentRoute.roomHash)
      await fetchMessages()
    } else {
      error = new Error('No room hash provided in route')
      loading = false
    }
    client.on('signal', (signal) => {
      if (!(SignalType.App in signal)) return;
      if (signal.App.zome_name !== "chatroom") return;
      const payload = signal.App.payload as ChatroomSignal;
      switch (payload.type) {
        case 'EntryCreated':
          if (payload.app_entry.type === 'Message' && encodeHashToBase64(payload.app_entry.room_hash) == encodeHashToBase64(roomHash))
            hashes = [...hashes, payload.action.hashed.hash]
          break
        default:
          break
      }
      return
    })
  })


  async function fetchMessages() {
    try {
      const links: Link[] = await client.callZome({
        cap_secret: null,
        role_name: 'chatroom',
        zome_name: 'chatroom',
        fn_name: 'get_messages_for_room',
        payload: encodeHashToBase64(roomHash),
      })

      hashes = links.map((l) => l.target)
    } catch (e) {
      error = e
    }
    loading = false
  }
</script>

<div>
  {#if loading}
    <div
      style="display: flex; flex: 1; align-items: center; justify-content: center"
    >
      Loading...
    </div>
  {:else if error}
    <span>Error fetching the messages: {error.data}.</span>
  {:else if hashes.length === 0}
    <span>No Messages found.</span>
  {:else}
    <div
      style="display: flex; flex-direction: column; overflow: auto; max-height: 500px;"
    >
      {#each hashes as hash}
        <div style="margin-bottom: 8px;">
          <!-- svelte-ignore missing-declaration -->
          <Message messageHash={hash} on:room-joined={() => fetchMessages()}
          ></Message>
        </div>
      {/each}
    </div>
  {/if}
</div>
{#if client }
<CreateMessage {roomHash} creator={client.myPubKey} />
{/if}
