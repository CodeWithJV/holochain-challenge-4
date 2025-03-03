<script lang="ts">
  import { onMount, getContext, createEventDispatcher } from 'svelte'
  import type { Record, ActionHash, AppClient, Link } from '@holochain/client'
  import { SignalType } from "@holochain/client";
  import { type ClientContext, clientContext } from "../../contexts";
  import Listing from './SearchRoomsListing.svelte'
  import type { ChatroomSignal, Page } from '../../types'
  import CreateRoom from './CreateRoom.svelte'

  const dispatch = createEventDispatcher()

  let client: AppClient;
  const appClientContext = getContext<ClientContext>(clientContext);

  let hashes: Array<ActionHash> = []
  let loading = true
  let error: any = undefined

  $: hashes, loading, error

  onMount(async () => {
    try {
      // Get the client from the context - it should already be initialized by App.svelte
      client = await appClientContext.ensureClientReady();
      
      // Set up signal handler and fetch rooms
      await fetchRooms();
      
      // Set up signal handler
      client.on('signal', (signal) => {
        if (!(SignalType.App in signal)) return;
        if (signal.App.zome_name !== "chatroom") return;
        const payload = signal.App.payload as ChatroomSignal;
        if (payload.type !== 'EntryCreated') return
        if (payload.app_entry.type !== 'Room') return
        hashes = [...hashes, payload.action.hashed.hash]
      });
    } catch (e) {
      error = e;
      loading = false;
    }
  });

  async function fetchRooms() {
    try {
      // Verify we have myPubKey before trying to fetch rooms
      if (!client || !client.myPubKey) {
        throw new Error("Client not ready - myPubKey not available");
      }
      
      const links: Link[] = await client.callZome({
        cap_secret: null,
        role_name: 'chatroom',
        zome_name: 'chatroom',
        fn_name: 'get_not_joined_rooms_for_member',
        payload: client.myPubKey,
      });
      hashes = links.map((l) => l.target);
    } catch (e) {
      error = e;
    } finally {
      loading = false;
    }
  }
</script>

<h1>Avaliable Chat Rooms</h1>
{#if loading}
  <div
    style="display: flex; flex: 1; align-items: center; justify-content: center"
  >
    Loading...
  </div>
{:else if error}
  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
    <p>Error fetching the rooms: {error}.</p>
  </div>
{:else if hashes.length === 0}
  <span>No rooms found.</span>
{:else}
  <div style="display: flex; flex-direction: column">
    {#each hashes as hash}
      <div style="margin-bottom: 8px;">
        <Listing
          roomHash={hash}
          on:room-joined={(e) =>
            dispatch('room-joined', { roomHash: e.detail.roomHash })}
        ></Listing>
      </div>
    {/each}
  </div>
{/if}
{#if client && client.myPubKey}
  <CreateRoom
    creator={client.myPubKey}
    on:room-created={(e) =>
      dispatch('room-created', { roomHash: e.detail.roomHash })}
  />
{/if}
