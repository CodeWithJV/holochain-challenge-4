# Challenge 4 - Scaffolding & Signals

In this challenge, we will build a messaging app. The frontend UI has been provided for you, however the backend has not. Here is an outline of the steps and lessons in this challenge:

- [ ] 1. Scaffolding entry types, collections, and links
- [ ] 2. Implementing zome functions
- [ ] 3. Sending and receiving remote signals from other Agents
- [ ] 4. Customizing remote signals

## Setup

#### 1. Fork this repo and clone it onto your local machine

#### 2. cd into `c-4` directory and run `nix develop`.

#### 3. Run `npm i` to install package dependencies

## Scaffolding entry types, collections, and links

When you use the scaffolding tool, Holochain scaffolds both the backend and the frontend. However for this challenge, the UI has been provided for you inside `ui/src/chatroom/premade-chatroom-ui` as we will be primarily focusing on the rust backend. You can still expect files generated by the scaffolding tool to show up inside the `chatroom` folder, however these can be ignored.

Before we get started there are a few key things to note:

- Everything you scaffold should be spelled as shown in the instructions. This is so that our Svelte frontend can interact with your Rust code correctly.
- If you make a mistake half way through a scaffold, in the terminal press `Ctrl + C` to cancel it, and start again.
- After each scaffold, I'd recommend you look through the generated code to understand and familiarize yourself with it.
- I'd also recommend you make a new commit to your git repo after each scaffold.
- `npm start` won't work until we've finished scaffolding

#### 1. Make sure that your project contains a `dnas` folder at its root, if it doesn't, then create one

#### 2. Navigate to the terminal, and run `hc scaffold dna`

Provide the following values for the prompts:

- DNA name: `chatroom`

#### 3. Navigate to the terminal, and run `hc scaffold zome`

- What do you want to scaffold? `Integrity/coordinator zome-pair`
- Enter coordinator zome name: `chatroom`
- Scaffold integrity zome in folder "dnas/chatroom/zomes/integrity/"? `y`
- Scaffold coordinator zome in "dnas/chatroom/zomes/coordinator/"? `y`

<details>
<summary>
Tip!
</summary>
After each scaffold, you should read through the generated content to more deeply understand what the scaffold is actually creating.
</details>

#### 4. Run `hc scaffold entry-type`

- Entry type name: `room`
- Which fields should the entry contain? `String`
- Field name: `name`
- Should this field be visible in the UI? `n`
  - Normally you'd choose yes, but in this instance we've created the frontend for you
- Add another field to the entry? `y`
- Choose field type: `AgentPubKey`
- Should a link from the AgentPubKey provided in this field also be created when entries of this type are created? `y`
  - Choosing this option will mean a link is created from the Creator Agent to the room in the DHT
- Which role does this agent play in the relationship? `creator`
- Field name: `creator`
- Add another field to the entry? `n`
- Which CRUD functions should be scaffolded? - Untick both Update, and Delete options

#### 5. Run `hc scaffold collection`

- Collection name: `all_rooms`
- Which type of collection should be scaffolded? `Global`
- Which entry type should be collected? `Room`

#### 6. Run `hc scaffold entry-type`

- Entry type name: `message`

- Choose field type: `String`
- Field name: `content`
- Should this field be visible in the UI? `n`

- Add another field to the entry? `y`
- Choose field type: `AgentPubKey`
- Should a link from the AgentPubKey provided in this field also be created when entries of this type are created? `y`
- Which role does this agent play in the relationship? `creator`
- Field name: `creator`

- Add another field to the entry? `y`
- Choose field type: `Timestamp`
- Field name: `timestamp`
- Should this field be visible in the UI? `n`

- Add another field to the entry? `y`
- Choose field type: `ActionHash`
- Should a link from the ActionHash provided in this field also be created when entries of this type are created? `y`
  - Choosing yes will create a link from this action hash (the room_hash) to the message, when a message is being created
- Which entry type is this field referring to? `Room`
- Field name: `room_hash`
- Add another field to the entry? `n`
- Which CRUD functions should be scaffolded? - Untick both Update, and Delete options

#### 7. Run `hc scaffold link-type`

- Link from which entry type? `Agent`
- Which role does this agent play in the relationship? `member`
- Link to which entry type? `Room`
- Reference this entry type with its entry hash or its action hash? `ActionHash`
- Should the link be bidirectional? `y`
  - Choosing `y` for this option creates two links. One from each Member Agent to each Room, and one from each Room to each Member. We want this because these entries have a [many to many relationship](<https://en.wikipedia.org/wiki/Many-to-many_(data_model)>) (One room can have many members, one member can be apart of many rooms)
- Can the link be deleted? `n`

Good job! You've scaffolded everything you need to for this project!

## Implementing zome functions

Now that we have scaffolded out the bulk of the project, we just need to implement a couple of changes to our zome functions that are more specific to this app, and aren't supplied by the scaffolder.

#### 1. Start by running `npm start` and opening up an agent window

You will notice our client is trying to make a zome call to fetch the available chatrooms, but is running into an error.

#### 2. Navigate to `chatroom/premade-chatroom-ui/SearchRooms.svelte`

This is where the failing zome call, `get_not_joined_rooms_for_member` is coming from.

#### 3. Navigate to `dnas/chatroom/zomes/coordinator/chatroom/src/member_to_rooms.rs` and implement a `get_not_joined_rooms_for_member` zome function that returns `ExternResult<Vec<Link>>`

<details>
<summary>
Hint - Breakdown of each step
</summary>

```rust
#[hdk_extern]
pub fn get_not_joined_rooms_for_member(member: AgentPubKey) -> ExternResult<Vec<Link>> {

    // Retrieve links to all rooms

    // Retrieve links to all joined rooms

    // Filter the vector of all rooms to only contain items that don't already exist in the joined rooms vector

    // Return the vector
}
```

</details>

Now when you create a chatroom, different agents can join it.

</details>

<details>
<summary>
Tip!
</summary>

Don't forget to Press `F5` or `Ctrl + R` to reload the window!

</details>

#### 4. Navigate to `coordinator/chatroom/src/room.rs` and modify the `create_room` function to also create two links: `RoomToMembers` and `MemberToRooms`

This means that when an agent creates a new room, they will also 'join' it as a member.

## Sending and receiving remote signals from other Agents

In our app we can create chatrooms, join them, and send messages to other Agents inside them. However every time a chatroom is created or a new message is sent, we have to manually refresh the window to view the new changes.

In this section we will use remote signals create a live update on each client when a new message is sent to a chatroom.

#### 1. Navigate to the `signal_action` function inside of `coordinator/chatroom/src/lib.rs`

This function is responsible for emitting local signals to the client for each type of action that occurs.

Inside the `Action::Create` arm of the match statement, we can see that we are emitting local signals to our client on each execution of a create action.

Modify this code so that when a create action containing a Message entry is made, we also emit a remote signal to each agent in the chat room.

The code should be along the lines of this:

```rust

Action::Create(_create) => {
    if let Ok(Some(app_entry)) = get_entry_for_action(&action.hashed.hash) {
        let new_signal = Signal::EntryCreated {
            app_entry: app_entry.clone(),
            action: action.clone(),
        };
        emit_signal(&new_signal)?;

        // If the create action's entry is of type Message

        // Get the entry off the create action

        // Get the room hash from the entry

        // call get_members_for_room() to get the members for the room using the room hash

        // Filter the members vector to exclude our agent pubkey (we don't want to send a remote signal to ourself)

        // remote_signal(new_signal, members)
    }
    Ok(())
}

```

<details>
<summary>
Hint
</summary>

```rust

Action::Create(_create) => {
    if let Ok(Some(app_entry)) = get_entry_for_action(&action.hashed.hash) {
        let new_signal = Signal::EntryCreated {
            app_entry,
            action: action.clone(),
        };
        emit_signal(&new_signal)?;

        // If the create action is of type Message
        if
            action.action().entry_type().unwrap().clone() ==
            UnitEntryTypes::Message.try_into()?
        {
            // Get the entry off the create action

            let record = get(action.hashed.hash.clone(), GetOptions::default())?.unwrap();

            let message = record.entry().to_app_option::<Message>().unwrap().unwrap();

            // Get the room hash from the entry
            let room_hash = message.room_hash;

            // Get the members for the room using the room hash
            let members: Vec<HoloHash<Agent>> = get_members_for_room(room_hash.clone())?
                .into_iter()
                .map(|link| {
                    AgentPubKey::try_from(link.target)
                        .map_err(|_| {
                            wasm_error!(
                                WasmErrorInner::Guest(
                                    String::from("Could not convert link to agent pub key")
                                )
                            )
                        })
                        .unwrap()
                })
                .filter(|agent| *agent != agent_info().unwrap().agent_latest_pubkey)
                .collect();

            let _ = send_remote_signal(new_signal, members);
        }
    }
    Ok(())
}
```

</details>

#### 2. Paste the following code snippet inside `coordinator/chatroom/src/lib.rs`

```rust

#[hdk_extern]
fn recv_remote_signal(signal: Signal) -> ExternResult<()> {
    emit_signal(signal)?;
    Ok(())
}
```

This function will receive the remote signal from the network and forward it to the client's frontend

#### 3. Replace the current `init` function inside `coordinator/chatroom/src/lib.rs` with the following code.

To allow other agents on the network to directly call the `recv_remote_signal` function, we need to give them access with a Capibility Grant. We will cover this more in depth in a future challenge.

```rust

#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
    let mut functions: BTreeSet<(ZomeName, FunctionName)> = BTreeSet::new();
    functions.insert((ZomeName::from("chatroom"), FunctionName::from("recv_remote_signal")));
    create_cap_grant(CapGrantEntry {
        tag: "recv_remote_signal_unrestricted".into(),
        access: CapAccess::Unrestricted,
        functions: GrantedFunctions::Listed(functions),
    })?;
    Ok(InitCallbackResult::Pass)
}
```

#### 4. Save the file, run `npm start`, and join both Agents into a chatroom.

Now when you send a message, its instantly received by the other client! - Kind of!

#### 5. Navigate to the `onMount` function of `premade-chatroom-ui/Conversation.svelte`

Inside `client.on()` Notice how when we receive a Message signal, we are instantly adding its hash to a 'hashes' array. This will cause svelte to rerender, and create a new `Message` Component, which will retrieve and display the Message record from the DHT by this hash.

The issue is that the remote signal is being received and the new message is requested from the DHT before the DHT has properly registered the addition of the new message.

#### 6. Fix the issue of messages being undefined

Unfortunately, there's not a super elegant solution to this. However, a couple of things you could try are:

- Delay the retrieval of the Message from the DHT by a second or two
- Or make multiple attempts after 0, 1, 3, 10 seconds etc to retrieve the Message from the DHT

## Customizing remote signals

Now that you've hopefully got your signals working, there's only one more issue to fix.

#### 1. Run `npm start`, have one agent create two chatrooms, 'Movies' and 'Books'

#### 2. Open up the 'Movies' chatroom using this agent.

#### 3. Have another agent join the 'Books' chatroom and send a message.

Notice the issue? Any new messages from any chatrooms an agent is in are received and added to the current conversation the agent is in, no matter what. However, we only want messages to be added to the conversation if they occur in this chatroom.

#### 4. Navigate to `coordinator/chatroom/src/lib.rs` and add a new variant to the Signal enum called `RemoteMessageCreated`

```rust
RemoteMessageCreated {
    action: SignedActionHashed,
    app_entry: EntryTypes,

    // Notice the addition of this field!
    room_hash: ActionHash,
},
```

#### 5. Modify the `Action::Create` arm of the match statement inside `signal_action` to transmit a `RemoteMessageCreated` signal instead

#### 6. Inside our frontend, add a new object to the `ChatroomSignal` type for `RemoteMessageCreated`

#### 7. Modify the `client.on()` function to only add the incoming message hash to the hashes array if `payload.room_hash` is equal to the room hash of the current chatroom

<details>
<summary>
Hint
</summary>

```ts
client.on('signal', (signal) => {
  if (signal.zome_name !== 'chatroom') return
  const payload = signal.payload as ChatroomSignal
  switch (payload.type) {
    case 'EntryCreated':
      if (payload.app_entry.type === 'Message')
        hashes = [...hashes, payload.action.hashed.hash]
      break
    case 'RemoteMessageCreated':
      if (
        encodeHashToBase64(payload.room_hash) === encodeHashToBase64(roomHash)
      )
        addMessage(payload.action.hashed.hash)
      break

    default:
      break
  }
  return
})

async function addMessage(message: ActionHash) {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  hashes = [...hashes, message]
}
```

</details>

Thats a wrap! 👏
