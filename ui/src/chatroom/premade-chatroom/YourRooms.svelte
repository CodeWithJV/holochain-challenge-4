<script lang="ts">
  import { onMount, getContext } from 'svelte'
  import type { ActionHash, AppClient, Link } from '@holochain/client'
  import { SignalType } from "@holochain/client";
  import { type ClientContext, clientContext } from "../../contexts";
  import Listing from './YourRoomListing.svelte'
  import type { ChatroomSignal } from '../../types'


  let client: AppClient;
  const appClientContext = getContext<ClientContext>(clientContext);

  let hashes: Array<ActionHash> | undefined
  let loading = true
  let error: any = undefined

  $: hashes, loading, error

  onMount(async () => {
    client = await appClientContext.getClient();
    await fetchRooms()
    client.on('signal', (signal) => {
      if (!(SignalType.App in signal)) return;
      if (signal.App.zome_name !== "chatroom") return;
      const payload = signal.App.payload as ChatroomSignal;
      if (payload.type !== 'EntryCreated') return
      if (payload.app_entry.type !== 'Room') return
      hashes = [...hashes, payload.action.hashed.hash]
    })
  })

  async function fetchRooms() {
    try {
      const links = await client.callZome({
        cap_secret: null,
        role_name: 'chatroom',
        zome_name: 'chatroom',
        fn_name: 'get_rooms_for_member',
        payload: client.myPubKey,
      })
      hashes = links.map((l) => l.target)
    } catch (e) {
      error = e
    }
    loading = false
  }
</script>

<h1>Joined Chat Rooms</h1>
{#if loading}
  <div
    style="display: flex; flex: 1; align-items: center; justify-content: center"
  >
    Loading...
  </div>
{:else if error}
  <span>Error fetching the rooms: {error.data}.</span>
{:else if hashes.length === 0}
  <span>No rooms found.</span>
{:else}
  <div style="display: flex; flex-direction: column">
    {#each hashes as hash}
      <div style="margin-bottom: 8px;">
        <Listing
          created={false}
          roomHash={hash}
          on:room-joined={() => fetchRooms()}
        ></Listing>
      </div>
    {/each}
  </div>
{/if}
