<script lang="ts">
import type { ActionHash, AgentPubKey, AppClient, DnaHash, EntryHash, HolochainError, Record } from "@holochain/client";
import { createEventDispatcher, getContext, onMount } from "svelte";
import { type ClientContext, clientContext } from "../../contexts";
import type { Room } from "./types";

const dispatch = createEventDispatcher();
let client: AppClient;
const appClientContext = getContext<ClientContext>(clientContext);

export let name!: string;
export let creator!: AgentPubKey;

$: name, creator;
$: isRoomValid = true;

onMount(async () => {
  if (name === undefined) {
    throw new Error(`The name input is required for the CreateRoom element`);
  }
  if (creator === undefined) {
    throw new Error(`The creator input is required for the CreateRoom element`);
  }
  client = await appClientContext.getClient();
});

async function createRoom() {
  const roomEntry: Room = {
    name: name!,
    creator: creator!,
  };

  try {
    const record: Record = await client.callZome({
      cap_secret: null,
      role_name: "chatroom",
      zome_name: "chatroom",
      fn_name: "create_room",
      payload: roomEntry,
    });
    dispatch("room-created", { roomHash: record.signed_action.hashed.hash });
  } catch (e) {
    alert((e as HolochainError).message);
  }
}
</script>

<div>
  <h3>Create Room</h3>

  <button disabled={!isRoomValid} on:click={() => createRoom()}>
    Create Room
  </button>
</div>
