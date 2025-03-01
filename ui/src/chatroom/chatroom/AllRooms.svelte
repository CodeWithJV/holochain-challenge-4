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
} from "@holochain/client";
import { SignalType } from "@holochain/client";
import { getContext, onMount } from "svelte";
import { type ClientContext, clientContext } from "../../contexts";
import RoomDetail from "./RoomDetail.svelte";
import type { ChatroomSignal } from "./types";

let client: AppClient;
const appClientContext = getContext<ClientContext>(clientContext);

let hashes: Array<ActionHash> = [];
let loading = false;
let error: any = undefined;

$: hashes, loading, error;

onMount(async () => {
  client = await appClientContext.getClient();
  await fetchRooms();
  client.on("signal", signal => {
    if (!(SignalType.App in signal)) return;
    if (signal.App.zome_name !== "chatroom") return;
    const payload = signal.App.payload as ChatroomSignal;
    if (payload.type !== "EntryCreated") return;
    if (payload.app_entry.type !== "Room") return;
    hashes = [...hashes, payload.action.hashed.hash];
  });
});

async function fetchRooms() {
  loading = true;
  try {
    const links: Array<Link> = await client.callZome({
      cap_secret: null,
      role_name: "chatroom",
      zome_name: "chatroom",
      fn_name: "get_all_rooms",
      payload: null,
    });
    if (links.length) {
      hashes = links.map(l => l.target);
    }
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
  <div class="alert">Error fetching the rooms: {error.message}.</div>
{:else if !hashes.length}
  <div class="alert">No rooms found.</div>
{:else}
  <div>
    {#each hashes as hash}
      <RoomDetail roomHash={hash} on:room-deleted={() => fetchRooms()} />
    {/each}
  </div>
{/if}
