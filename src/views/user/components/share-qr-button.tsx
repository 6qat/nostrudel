import {
  IconButton,
  IconButtonProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  useDisclosure,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { RelayMode } from "../../../classes/relay";
import { QrCodeIcon } from "../../../components/icons";
import QrCodeSvg from "../../../components/qr-code-svg";
import { Bech32Prefix, normalizeToBech32 } from "../../../helpers/nip19";
import useFallbackUserRelays from "../../../hooks/use-fallback-user-relays";
import relayScoreboardService from "../../../services/relay-scoreboard";
import { nip19 } from "nostr-tools";

function useUserShareLink(pubkey: string) {
  const userRelays = useFallbackUserRelays(pubkey);

  return useMemo(() => {
    const writeUrls = userRelays.filter((r) => r.mode & RelayMode.WRITE).map((r) => r.url);
    const ranked = relayScoreboardService.getRankedRelays(writeUrls);
    const onlyTwo = ranked.slice(0, 2);

    return onlyTwo.length > 0 ? nip19.nprofileEncode({ pubkey, relays: onlyTwo }) : nip19.npubEncode(pubkey);
  }, [userRelays]);
}

export const QrIconButton = ({ pubkey, ...props }: { pubkey: string } & Omit<IconButtonProps, "icon">) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const npub = normalizeToBech32(pubkey, Bech32Prefix.Pubkey) || pubkey;
  const nprofile = useUserShareLink(pubkey);

  return (
    <>
      <IconButton icon={<QrCodeIcon />} onClick={onOpen} {...props} />
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p="2">
            <Tabs>
              <TabList>
                <Tab>npub</Tab>
                <Tab>nprofile</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <QrCodeSvg content={"nostr:" + npub} border={2} />
                </TabPanel>
                <TabPanel>
                  <QrCodeSvg content={"nostr:" + nprofile} border={2} />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};