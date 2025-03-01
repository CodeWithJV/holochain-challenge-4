<script lang="ts">
import type { ActionHash, AgentPubKey, AppClient, DnaHash, EntryHash, HolochainError, Record } from "@holochain/client";
import { decode } from "@msgpack/msgpack";
import { createEventDispatcher, getContext, onMount } from "svelte";
import { type ClientContext, clientContext } from "../../contexts";
import type { Room } from "./types";

let client: AppClient;
const appClientContext = getContext<ClientContext>(clientContext);
const dispatch = createEventDispatcher();

let loading: boolean = false;
let error: HolochainError | undefined;
let record: Record | undefined;
let room: Room | undefined;

export let roomHash: ActionHash;

$: error, loading, record, room;

onMount(async () => {
  if (roomHash === undefined) {
    throw new Error(`The roomHash input is required for the RoomDetail element`);
  }
  client = await appClientContext.getClient();
  await fetchRoom();
});

async function fetchRoom() {
  loading = true;
  try {
    record = await client.callZome({
      cap_secret: null,
      role_name: "chatroom",
      zome_name: "chatroom",
      fn_name: "get_room",
      payload: roomHash,
    });
    if (record) {
      room = decode((record.entry as any).Present.entry) as Room;
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
  <div class="alert">Error fetching the room: {error.message}</div>
{:else}
  <section>
    <div>
      <span><strong>Name:</strong></span>
      <span>{room?.name}</span>
    </div>

    <div></div>
  </section>
{/if}
