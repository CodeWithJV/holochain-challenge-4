<script lang="ts">
import type {
  ActionHash,
  AgentPubKey,
  AppClient,
  EntryHash,
  HolochainError,
  Link,
  NewEntryAction,
  Record,
  SignalType,
} from "@holochain/client";
import { SignalType } from "@holochain/client";
import { getContext, onMount } from "svelte";
import { type ClientContext, clientContext } from "../../contexts";
import MessageDetail from "./MessageDetail.svelte";
import type { ChatroomSignal, Message } from "./types";

let client: AppClient;
const appClientContext = getContext<ClientContext>(clientContext);

let hashes: Array<ActionHash> | undefined = [];
let loading: boolean;
let error: any = undefined;

export let roomHash: ActionHash;

$: hashes, loading, error;

onMount(async () => {
  if (roomHash === undefined) {
    throw new Error(`The roomHash input is required for the MessagesForRoom element`);
  }
  client = await appClientContext.getClient();
  await fetchMessages();

  client.on("signal", async signal => {
    if (!(SignalType.App in signal)) return;
    if (signal.App.zome_name !== "chatroom") return;
    const payload = signal.App.payload as ChatroomSignal;
    if (!(payload.type === "EntryCreated" && payload.app_entry.type === "Message")) return;
    await fetchMessages();
  });
});

async function fetchMessages() {
  loading = true;
  try {
    const links: Array<Link> = await client.callZome({
      cap_secret: null,
      role_name: "chatroom",
      zome_name: "chatroom",
      fn_name: "get_messages_for_room",
      payload: roomHash,
    });
    hashes = links.map(l => l.target);
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
  <div class="alert">Error fetching messages: ${error.message}.</div>
{:else if hashes.length === 0}
  <div class="alert">No messages found for this room.</div>
{:else}
  <div>
    {#each hashes as hash}
      <MessageDetail messageHash={hash} on:message-deleted={fetchMessages} />
    {/each}
  </div>
{/if}
