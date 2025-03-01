<script lang="ts">
  import { createEventDispatcher, getContext, onMount } from 'svelte'
  import type {
    AppClient,
    Record,
    AgentPubKey,
    ActionHash,
  } from '@holochain/client'
  import { type ClientContext, clientContext } from "../../contexts";
  import type { Message } from '../../types'

  let client: AppClient;
  const appClientContext = getContext<ClientContext>(clientContext);

  const dispatch = createEventDispatcher()

  export let creator!: AgentPubKey
  export let roomHash!: ActionHash

  let content: string = ''
  let timestamp: number = Date.now()

  $: content, creator, timestamp, roomHash
  $: isMessageValid = true && content !== '' && true

  onMount(async () => {
    client = await appClientContext.getClient();
    if (creator === undefined) {
      throw new Error(
        `The creator input is required for the CreateMessage element`
      )
    }
  })

  async function createMessage() {
    const messageEntry: Message = {
      content: content!,
      creator: creator!,
      timestamp: timestamp!,
      room_hash: roomHash,
    }

    try {
      const record: Record = await client.callZome({
        cap_secret: null,
        role_name: 'chatroom',
        zome_name: 'chatroom',
        fn_name: 'create_message',
        payload: messageEntry,
      })
      dispatch('message-created', {
        messageHash: record.signed_action.hashed.hash,
      })
      content = '';
    } catch (e) {
      alert(`Error creating the message: ${e.data}`)
    }
  }
</script>

<div style="display: flex; flex-direction: column">
  <span style="font-size: 18px">Create Message</span>

  <div style="margin-bottom: 16px">
    <textarea
      on:input={(e) => {
        content = e.target.value
      }}
      on:keydown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          if (isMessageValid) createMessage();
          e.preventDefault();
        }
      }}
      required
    >{content}</textarea>
  </div>

  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <button
    disabled={!isMessageValid}
    on:click={() => createMessage()}
  >Create Message</button>
</div>
