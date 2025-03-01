<script lang="ts">
  import { createEventDispatcher, onMount, getContext } from 'svelte'
  import { decode } from '@msgpack/msgpack'
  import type { Record, ActionHash, AppClient } from '@holochain/client'
  import { encodeHashToBase64 } from '@holochain/client'
  import { type ClientContext, clientContext } from "../../contexts";
  import type { Page, Room } from '../../types'
  import { currentRoute } from '../../stores/navigation'

  const dispatch = createEventDispatcher()

  export let roomHash: ActionHash
  export let created: boolean = false

  let client: AppClient;
  const appClientContext = getContext<ClientContext>(clientContext);

  let loading: boolean
  let error: any = undefined

  let record: Record | undefined
  let room: Room | undefined

  $: error, loading, record, room, created

  onMount(async () => {
    client = await appClientContext.getClient();
    if (roomHash === undefined) {
      throw new Error(
        `The roomHash input is required for the RoomDetail element`
      )
    }
    await fetchRoom()
  })

  async function fetchRoom() {
    loading = true

    try {
      record = await client.callZome({
        cap_secret: null,
        role_name: 'chatroom',
        zome_name: 'chatroom',
        fn_name: 'get_room',
        payload: roomHash,
      })
      if (record) {
        room = decode((record.entry as any).Present.entry) as Room
      }
    } catch (e) {
      error = e
    }

    loading = false
  }
</script>

{#if loading}
  <div
    style="display: flex; flex: 1; align-items: center; justify-content: center"
  >
    Loading...
  </div>
{:else if error}
  <span>Error fetching the room: {error.data}</span>
{:else}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    style="display: flex; flex-direction: row; justify-content: space-between;"
  >
    <span style="white-space: pre-line; margin-top: auto; margin-bottom: auto;"
      ><strong>{room?.name}</strong></span
    >
    <div style="display: flex; flex-direction: row">
      <button
        style="margin-top: auto; margin-bottom: auto;"
        on:click={() => {
          currentRoute.set({ 
            path: '/conversation',
            roomHash: encodeHashToBase64(roomHash)
          });
        }}
      >Chat</button>
    </div>
  </div>
{/if}
