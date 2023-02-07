import { Box, LinkBox, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import useSubject from "../hooks/use-subject";
import identity from "../services/identity";
import { UserAvatar } from "./user-avatar";
import { useUserMetadata } from "../hooks/use-user-metadata";
import { normalizeToBech32 } from "../helpers/nip-19";

export type ProfileButtonProps = {
  to: string;
};

export const ProfileButton = ({ to }: ProfileButtonProps) => {
  const pubkey = useSubject(identity.pubkey);
  const metadata = useUserMetadata(pubkey);

  return (
    <LinkBox
      as={Link}
      maxW="sm"
      p="2"
      borderWidth="1px"
      rounded="md"
      to={to}
      display="flex"
      gap="2"
      overflow="hidden"
    >
      <UserAvatar pubkey={pubkey} />
      <Box>
        <Text fontWeight="bold">{metadata?.name}</Text>
        <Text>{normalizeToBech32(pubkey)}</Text>
      </Box>
    </LinkBox>
  );
};
