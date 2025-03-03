import type {
  ActionHash,
  AgentPubKey,
  Create,
  CreateLink,
  Delete,
  DeleteLink,
  DnaHash,
  EntryHash,
  ExternalHash,
  Record,
  SignedActionHashed,
  Update,
} from "@holochain/client";

export type ChatroomSignal = {
  type: "EntryCreated";
  action: SignedActionHashed<Create>;
  app_entry: EntryTypes;
} | {
  type: "EntryUpdated";
  action: SignedActionHashed<Update>;
  app_entry: EntryTypes;
  original_app_entry: EntryTypes;
} | {
  type: "EntryDeleted";
  action: SignedActionHashed<Delete>;
  original_app_entry: EntryTypes;
} | {
  type: "LinkCreated";
  action: SignedActionHashed<CreateLink>;
  link_type: string;
} | {
  type: "LinkDeleted";
  action: SignedActionHashed<DeleteLink>;
  link_type: string;
};

/* dprint-ignore-start */
export type EntryTypes =
 | ({ type: 'Message'; } & Message)
 | ({  type: 'Room'; } & Room);
/* dprint-ignore-end */

export interface Room {
  name: string;
  creator: AgentPubKey;
}

export interface Message {
  content: string;
  creator: AgentPubKey;
  timestamp: number;
  room_hash: ActionHash;
}
