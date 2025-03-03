<script lang="ts">
  import { createEventDispatcher, onMount, getContext } from 'svelte'
  import { decode } from '@msgpack/msgpack'
  import {
    type Record,
    type ActionHash,
    type AppClient,
    encodeHashToBase64,
  } from '@holochain/client'
  import { type ClientContext, clientContext } from "../../contexts";
  import type { Message } from '../../types'

  const dispatch = createEventDispatcher()

  export let messageHash: ActionHash

  let client: AppClient;
  const appClientContext = getContext<ClientContext>(clientContext);

  let loading: boolean
  let error: any = undefined

  let record: Record | undefined
  let message: Message | undefined
  let messageCreatorSliced: string
  let messageCreator: string

  let myPubKey: string

  let editing = false

  let errorSnackbar: Snackbar

  $: editing,
    error,
    loading,
    record,
    message,
    messageCreatorSliced,
    messageCreator,
    myPubKey


  async function fetchMessage() {
    loading = true
    error = undefined

    try {
      record = await client.callZome({
        cap_secret: null,
        role_name: 'chatroom',
        zome_name: 'chatroom',
        fn_name: 'get_message',
        payload: messageHash,
      })
      
      if (record) {
        message = decode((record.entry as any).Present.entry) as Message
        messageCreator = encodeHashToBase64(message?.creator)
        messageCreatorSliced = messageCreator.slice(0, 7)
      } else {
      console.log('message undefined')
        message = undefined;
      }
    } catch (e) {
      console.log(e);
      error = e;
    }

    loading = false
  }

  onMount(async () => {
    client = await appClientContext.getClient();
    myPubKey = encodeHashToBase64(client.myPubKey)
    if (messageHash === undefined) {
      throw new Error(
        `The messageHash input is required for the MessageDetail element`
      )
    }
    await fetchMessage()
  })
</script>

{#if loading}
  <div
    style="display: flex; flex: 1; align-items: center; justify-content: center"
  >
    Loading...
  </div>
{:else if error}
  <span>Error fetching the message: {error.data}</span>
{:else if messageCreator === myPubKey}
  <div
    style="display: flex; flex-direction: row; padding:10px; background-color: #c2a5d0; border-radius: 10px;  width: min-content; margin-left: auto;"
  >
    <span style="margin-right: 4px"><strong>You:</strong></span>
    <span style="white-space: pre-line">{message?.content}</span>
  </div>
{:else}
  <div
    style="display: flex; flex-direction: row; padding:10px; background-color: #d4bbff; border-radius: 10px;  width: min-content;"
  >
    <span style="margin-right: 4px"
      ><strong>{messageCreatorSliced || 'Uknown'}:</strong></span
    >
    <span style="white-space: pre-line">{message?.content}</span>
  </div>
{/if}
