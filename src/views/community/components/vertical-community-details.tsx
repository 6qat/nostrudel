import { Box, ButtonGroup, Card, CardProps, Flex, Heading, Text, useDisclosure } from "@chakra-ui/react";
import {
  getCommunityDescription,
  getCommunityMods,
  getCommunityRelays,
  getCommunityRules,
} from "../../../helpers/nostr/communities";
import CommunityDescription from "../../communities/components/community-description";
import UserAvatarLink from "../../../components/user-avatar-link";
import { UserLink } from "../../../components/user-link";
import { RelayIconStack } from "../../../components/relay-icon-stack";
import { NostrEvent } from "../../../types/nostr-event";
import CommunityJoinButton from "../../communities/components/community-subscribe-button";
import CommunityMenu from "./community-menu";
import useCountCommunityMembers from "../../../hooks/use-count-community-members";
import CommunityMembersModal from "./community-members-modal";
import { readablizeSats } from "../../../helpers/bolt11";

export default function VerticalCommunityDetails({
  community,
  ...props
}: Omit<CardProps, "children"> & { community: NostrEvent }) {
  const membersModal = useDisclosure();
  const communityRelays = getCommunityRelays(community);
  const mods = getCommunityMods(community);
  const description = getCommunityDescription(community);
  const rules = getCommunityRules(community);

  const countMembers = useCountCommunityMembers(community);

  return (
    <>
      <Card p="4" gap="4" {...props}>
        {description && (
          <Box>
            <Heading size="sm" mb="1">
              About
            </Heading>
            <CommunityDescription community={community} maxLength={256} showExpand />
          </Box>
        )}
        <ButtonGroup w="full">
          <CommunityJoinButton community={community} flex={1} />
          <CommunityMenu community={community} aria-label="More" />
        </ButtonGroup>
        <Box>
          <Heading size="sm" mb="1">
            Mods
          </Heading>
          <Flex direction="column" gap="2">
            {mods.map((pubkey) => (
              <Flex gap="2">
                <UserAvatarLink pubkey={pubkey} size="xs" />
                <UserLink pubkey={pubkey} />
              </Flex>
            ))}
          </Flex>
        </Box>
        <Box as="button" textAlign="start" cursor="pointer" onClick={membersModal.onOpen}>
          <Heading size="sm" mb="1">
            Members
          </Heading>
          <Text>{countMembers ? readablizeSats(countMembers) : "unknown"}</Text>
        </Box>
        {rules && (
          <Box>
            <Heading size="sm" mb="1">
              Rules
            </Heading>
            <Text whiteSpace="pre-wrap">{rules}</Text>
          </Box>
        )}
        {communityRelays.length > 0 && (
          <Box>
            <Heading size="sm" mb="1">
              Relays
            </Heading>
            <Flex direction="column" gap="2">
              <RelayIconStack relays={communityRelays} />
            </Flex>
          </Box>
        )}
      </Card>
      {membersModal.isOpen && (
        <CommunityMembersModal isOpen={membersModal.isOpen} onClose={membersModal.onClose} community={community} />
      )}
    </>
  );
}
