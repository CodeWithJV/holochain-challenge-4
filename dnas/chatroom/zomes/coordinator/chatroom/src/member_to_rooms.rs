use chatroom_integrity::*;
use hdk::prelude::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct AddRoomForMemberInput {
    pub base_member: AgentPubKey,
    pub target_room_hash: ActionHash,
}

#[hdk_extern]
pub fn add_room_for_member(input: AddRoomForMemberInput) -> ExternResult<()> {
    create_link(
        input.base_member.clone(),
        input.target_room_hash.clone(),
        LinkTypes::MemberToRooms,
        (),
    )?;
    create_link(
        input.target_room_hash,
        input.base_member,
        LinkTypes::RoomToMembers,
        (),
    )?;
    Ok(())
}

#[hdk_extern]
pub fn get_rooms_for_member(member: AgentPubKey) -> ExternResult<Vec<Link>> {
    get_links(GetLinksInputBuilder::try_new(member, LinkTypes::MemberToRooms)?.build())
}

#[hdk_extern]
pub fn get_members_for_room(room_hash: ActionHash) -> ExternResult<Vec<Link>> {
    get_links(GetLinksInputBuilder::try_new(room_hash, LinkTypes::RoomToMembers)?.build())
}
