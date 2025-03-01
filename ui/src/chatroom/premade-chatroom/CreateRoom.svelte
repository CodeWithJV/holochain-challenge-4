<script lang="ts">
  import { createEventDispatcher, getContext, onMount } from 'svelte'
  import type { AppClient, Record, AgentPubKey } from '@holochain/client'
  import { encodeHashToBase64 } from '@holochain/client'
  import { type ClientContext, clientContext } from "../../contexts";
  import type { Room } from '../../types'
  import { currentRoute } from '../../stores/navigation'

  let client: AppClient;
  const appClientContext = getContext<ClientContext>(clientContext);

  const dispatch = createEventDispatcher()

  export let creator!: AgentPubKey

  let name: string = ''

  let errorSnackbar: Snackbar

  $: name, creator
  $: isRoomValid = true && name !== ''

  onMount(async () => {
    client = await appClientContext.getClient();
    if (creator === undefined) {
      throw new Error(
        `The creator input is required for the CreateRoom element`
      )
    }
  })

  async function createRoom() {
    const roomEntry: Room = {
      name: name!,
      creator: creator!,
    }

    try {
      const record: Record = await client.callZome({
        cap_secret: null,
        role_name: 'chatroom',
        zome_name: 'chatroom',
        fn_name: 'create_room',
        payload: roomEntry,
      })
      const roomHash = record.signed_action.hashed.hash;
      dispatch('room-created', { roomHash });
      currentRoute.set({ 
        path: '/conversation',
        roomHash: encodeHashToBase64(roomHash)
      });
    } catch (e) {
      errorSnackbar.labelText = `Error creating the room: ${e.data}`
      errorSnackbar.show()
    }
  }
</script>

<div style="display: flex; flex-direction: column">
  <span style="font-size: 18px">Create Room</span>

  <div style="margin-bottom: 16px">
    <input
      type="text"
      maxlength="20"
      value={name}
      on:input={(e) => {
        name = e.target.value
      }}
      required
    />
  </div>

  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <button
    style="width: 232px; margin-left: auto; margin-right: auto;"
    disabled={!isRoomValid}
    on:click={() => createRoom()}
  >Create Room</button>
</div>
