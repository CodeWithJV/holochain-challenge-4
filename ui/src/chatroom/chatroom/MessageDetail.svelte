<script lang="ts">
import type { ActionHash, AgentPubKey, AppClient, DnaHash, EntryHash, HolochainError, Record } from "@holochain/client";
import { decode } from "@msgpack/msgpack";
import { createEventDispatcher, getContext, onMount } from "svelte";
import { type ClientContext, clientContext } from "../../contexts";
import type { Message } from "./types";

const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRIES = 5;

let client: AppClient;
let retryCount = 0;
let retryTimeout: NodeJS.Timeout | undefined;
const appClientContext = getContext<ClientContext>(clientContext);
const dispatch = createEventDispatcher();

let loading: boolean = false;
let error: HolochainError | undefined;
let record: Record | undefined;
let message: Message | undefined;

export let messageHash: ActionHash;

$: error, loading, record, message;

onMount(async () => {
  if (messageHash === undefined) {
    throw new Error(`The messageHash input is required for the MessageDetail element`);
  }
  client = await appClientContext.getClient();
  await fetchMessage();
});

async function fetchMessage() {
  loading = true;
  error = undefined;
  
  try {
    record = await client.callZome({
      cap_secret: null,
      role_name: "chatroom",
      zome_name: "chatroom",
      fn_name: "get_message",
      payload: messageHash,
    });
    
    if (record) {
      message = decode((record.entry as any).Present.entry) as Message;
      retryCount = 0; // Reset retry count on success
    } else {
      console.log('not found');
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        retryCount++;
        console.log(`Message not found, retrying in ${delay}ms (attempt ${retryCount}/${MAX_RETRIES})`);
        retryTimeout = setTimeout(fetchMessage, delay);
      } else {
        console.log('Max retries reached, giving up');
        error = new Error('Failed to load message after maximum retries') as HolochainError;
      }
    }
  } catch (e) {
    error = e as HolochainError;
    console.log(e);
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      retryCount++;
      console.log(`Error fetching message, retrying in ${delay}ms (attempt ${retryCount}/${MAX_RETRIES})`);
      retryTimeout = setTimeout(fetchMessage, delay);
    }
  } finally {
    loading = false;
  }
}
</script>

{#if loading}
  <progress />
{:else if error}
  <div class="alert">Error fetching the message: {error.message}</div>
{:else}
  <section>
    <div>
      <span><strong>Content:</strong></span>
      <span>{message ? message?.content :  'Loading...'}</span>
    </div>
    <div>
      <span><strong>Timestamp:</strong></span>
      <span>{new Date(message?.timestamp / 1000).toLocaleString()}</span>
    </div>

    <div></div>
  </section>
{/if}
