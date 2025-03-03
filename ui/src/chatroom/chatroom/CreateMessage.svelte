<script lang="ts">
import type { ActionHash, AgentPubKey, AppClient, DnaHash, EntryHash, HolochainError, Record } from "@holochain/client";
import { createEventDispatcher, getContext, onMount } from "svelte";
import { type ClientContext, clientContext } from "../../contexts";
import type { Message } from "./types";

const dispatch = createEventDispatcher();
let client: AppClient;
const appClientContext = getContext<ClientContext>(clientContext);

export let content!: string;
export let creator!: AgentPubKey;
export let timestamp!: number;
export let roomHash!: ActionHash;

$: content, creator, timestamp, roomHash;
$: isMessageValid = true;

onMount(async () => {
  if (content === undefined) {
    throw new Error(`The content input is required for the CreateMessage element`);
  }
  if (creator === undefined) {
    throw new Error(`The creator input is required for the CreateMessage element`);
  }
  if (timestamp === undefined) {
    throw new Error(`The timestamp input is required for the CreateMessage element`);
  }
  if (roomHash === undefined) {
    throw new Error(`The roomHash input is required for the CreateMessage element`);
  }
  client = await appClientContext.getClient();
});

async function createMessage() {
  const messageEntry: Message = {
    content: content!,
    creator: creator!,
    timestamp: timestamp!,
    room_hash: roomHash!,
  };

  try {
    const record: Record = await client.callZome({
      cap_secret: null,
      role_name: "chatroom",
      zome_name: "chatroom",
      fn_name: "create_message",
      payload: messageEntry,
    });
    dispatch("message-created", { messageHash: record.signed_action.hashed.hash });
  } catch (e) {
    alert((e as HolochainError).message);
  }
}
</script>

<div>
  <h3>Create Message</h3>

  <button disabled={!isMessageValid} on:click={() => createMessage()}>
    Create Message
  </button>
</div>
