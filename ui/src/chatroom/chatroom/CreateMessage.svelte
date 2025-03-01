<script lang="ts">
import type { ActionHash, AgentPubKey, AppClient, DnaHash, EntryHash, HolochainError, Record } from "@holochain/client";
import { createEventDispatcher, getContext, onMount } from "svelte";
import { type ClientContext, clientContext } from "../../contexts";
import type { Message } from "./types";

const dispatch = createEventDispatcher();
let client: AppClient;
const appClientContext = getContext<ClientContext>(clientContext);

let content: string = "";
let timestamp: number = Date.now();

export let creator!: AgentPubKey;
export let roomHash!: ActionHash;

$: content, creator, timestamp, roomHash;
$: isMessageValid = true && content !== "" && true;

onMount(async () => {
  if (creator === undefined) {
    throw new Error(`The creator input is required for the CreateMessage element`);
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

  <div>
    <label for="Content">Content</label>
    <textarea 
      name="Content" 
      bind:value={content} 
      on:keydown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          if (isMessageValid) createMessage();
          e.preventDefault();
        }
      }}
      required 
    />
  </div>
  <div>
    <label for="Timestamp">Timestamp</label>
    <input
      name="Timestamp"
      type="datetime-local"
      value={new Date(timestamp / 1000 - (new Date(timestamp / 1000).getTimezoneOffset() * 60000)).toISOString().slice(0, 16)}
      on:input={(e) => timestamp = Math.floor(new Date(e.currentTarget.value).getTime() / 1000)}
      required
    />
  </div>

  <button disabled={!isMessageValid} on:click={() => createMessage()}>
    Create Message
  </button>
</div>
