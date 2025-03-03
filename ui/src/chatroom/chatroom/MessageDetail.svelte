<script lang="ts">
import type { ActionHash, AgentPubKey, AppClient, DnaHash, EntryHash, HolochainError, Record } from "@holochain/client";
import { decode } from "@msgpack/msgpack";
import { createEventDispatcher, getContext, onMount } from "svelte";
import { type ClientContext, clientContext } from "../../contexts";
import type { Message } from "./types";

let client: AppClient;
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
    }
  } catch (e) {
    error = e as HolochainError;
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
    <div></div>
  </section>
{/if}
