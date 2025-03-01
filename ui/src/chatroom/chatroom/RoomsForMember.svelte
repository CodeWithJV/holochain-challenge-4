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

let hashes: Array<ActionHash> | undefined;
let loading = false;
let error: any = undefined;

export let member: AgentPubKey;

$: hashes, loading, error;

onMount(async () => {
  if (!member) {
    throw new Error(`The member input is required for the RoomsForMember element`);
  }
  client = await appClientContext.getClient();
  try {
    loading = true;
    const links: Array<Link> = await client.callZome({
      cap_secret: null,
      role_name: "chatroom",
      zome_name: "chatroom",
      fn_name: "get_rooms_for_member",
      payload: member,
    });
    hashes = links.map(l => l.target);
  } catch (e) {
    error = e as HolochainError;
  } finally {
    loading = false;
  }

  client.on("signal", signal => {
    if (!(SignalType.App in signal)) return;
    if (signal.App.zome_name !== "chatroom") return;
    const payload = signal.App.payload as ChatroomSignal;
    if (payload.type !== "LinkCreated") return;
    if (payload.link_type !== "MemberToRooms") return;

    hashes = [...hashes, payload.action.hashed.content.target_address];
  });
});
</script>

{#if loading}
  <progress />
{:else if error}
  <div class="alert">Error fetching rooms: {error.message}.</div>
{:else if hashes.length === 0}
  <div class="alert">No rooms found for this member.</div>
{:else}
  <div>
    {#each hashes as hash}
      <RoomDetail roomHash={hash} />
    {/each}
  </div>
{/if}
