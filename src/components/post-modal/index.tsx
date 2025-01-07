import { useRef, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Flex,
  Button,
  Box,
  Heading,
  useDisclosure,
  Input,
  Switch,
  ModalProps,
  FormLabel,
  FormControl,
  FormHelperText,
  Link,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  ModalCloseButton,
  Alert,
  AlertIcon,
  ButtonGroup,
  Text,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { UnsignedEvent } from "nostr-tools";
import { useAsync, useThrottle } from "react-use";
import { useEventFactory, useObservable } from "applesauce-react/hooks";
import { Emoji, ZapSplit } from "applesauce-core/helpers";

import { ChevronDownIcon, ChevronUpIcon } from "../icons";
import PublishAction from "../../classes/nostr-publish-action";
import { PublishDetails } from "../../views/task-manager/publish-log/publish-details";
import { TrustProvider } from "../../providers/local/trust-provider";
import MagicTextArea, { RefType } from "../magic-textarea";
import { useContextEmojis } from "../../providers/global/emoji-provider";
import ZapSplitCreator from "../../views/new/note/zap-split-creator";
import useCurrentAccount from "../../hooks/use-current-account";
import useCacheForm from "../../hooks/use-cache-form";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../hooks/use-textarea-upload-file";
import MinePOW from "../pow/mine-pow";
import useAppSettings from "../../hooks/use-user-app-settings";
import { ErrorBoundary } from "../error-boundary";
import { useFinalizeDraft, usePublishEvent } from "../../providers/global/publish-provider";
import { TextNoteContents } from "../note/timeline-note/text-note-contents";
import localSettings from "../../services/local-settings";
import useLocalStorageDisclosure from "../../hooks/use-localstorage-disclosure";
import InsertGifButton from "../gif/insert-gif-button";
import InsertImageButton from "../../views/new/note/insert-image-button";

type FormValues = {
  content: string;
  nsfw: boolean;
  nsfwReason: string;
  split: Omit<ZapSplit, "percent" | "relay">[];
  difficulty: number;
};

export type PostModalProps = {
  cacheFormKey?: string | null;
  initContent?: string;
};

export default function PostModal({
  isOpen,
  onClose,
  cacheFormKey = "new-note",
  initContent = "",
}: Omit<ModalProps, "children"> & PostModalProps) {
  const publish = usePublishEvent();
  const finalizeDraft = useFinalizeDraft();
  const account = useCurrentAccount()!;
  const { noteDifficulty } = useAppSettings();
  const addClientTag = useObservable(localSettings.addClientTag);
  const promptAddClientTag = useLocalStorageDisclosure("prompt-add-client-tag", true);
  const [miningTarget, setMiningTarget] = useState(0);
  const [publishAction, setPublishAction] = useState<PublishAction>();
  const emojis = useContextEmojis();
  const moreOptions = useDisclosure();

  const factory = useEventFactory();
  const [draft, setDraft] = useState<UnsignedEvent>();
  const { getValues, setValue, watch, register, handleSubmit, formState, reset } = useForm<FormValues>({
    defaultValues: {
      content: initContent,
      nsfw: false,
      nsfwReason: "",
      split: [] as Omit<ZapSplit, "percent" | "relay">[],
      difficulty: noteDifficulty || 0,
    },
    mode: "all",
  });

  // watch form state
  formState.isDirty;
  watch("content");
  watch("nsfw");
  watch("nsfwReason");
  watch("split");
  watch("difficulty");

  // cache form to localStorage
  useCacheForm<FormValues>(cacheFormKey, getValues, reset, formState);

  const getDraft = async (values = getValues()) => {
    // build draft using factory
    let draft = await factory.note(values.content, {
      emojis: emojis.filter((e) => !!e.url) as Emoji[],
      contentWarning: values.nsfw ? values.nsfwReason || values.nsfw : false,
      splits: values.split,
    });

    const unsigned = await finalizeDraft(draft);

    setDraft(unsigned);
    return unsigned;
  };

  // throttle update the draft every 500ms
  const throttleValues = useThrottle(getValues(), 500);
  const { value: preview } = useAsync(() => getDraft(), [throttleValues]);

  const textAreaRef = useRef<RefType | null>(null);
  const insertText = useTextAreaInsertTextWithForm(textAreaRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  const publishPost = async (unsigned?: UnsignedEvent) => {
    unsigned = unsigned || draft || (await getDraft());

    const pub = await publish("Post", unsigned);
    if (pub) setPublishAction(pub);
  };
  const submit = handleSubmit(async (values) => {
    if (values.difficulty > 0) {
      setMiningTarget(values.difficulty);
    } else {
      const unsigned = await getDraft(values);
      publishPost(unsigned);
    }
  });

  const canSubmit = getValues().content.length > 0;

  const renderBody = () => {
    if (publishAction) {
      return (
        <ModalBody display="flex" flexDirection="column" padding={["2", "2", "4"]} gap="2">
          <PublishDetails pub={publishAction} />
          <Button onClick={onClose} mt="2" ml="auto">
            Close
          </Button>
        </ModalBody>
      );
    }

    if (miningTarget && draft) {
      return (
        <ModalBody display="flex" flexDirection="column" padding={["2", "2", "4"]} gap="2">
          <MinePOW
            draft={draft}
            targetPOW={miningTarget}
            onCancel={() => setMiningTarget(0)}
            onSkip={publishPost}
            onComplete={publishPost}
          />
        </ModalBody>
      );
    }

    // TODO: wrap this in a form
    return (
      <>
        <ModalBody display="flex" flexDirection="column" padding={["2", "2", "4"]} gap="2">
          <MagicTextArea
            autoFocus
            mb="2"
            value={getValues().content}
            onChange={(e) => setValue("content", e.target.value, { shouldDirty: true, shouldTouch: true })}
            rows={5}
            isRequired
            instanceRef={(inst) => (textAreaRef.current = inst)}
            onPaste={onPaste}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submit();
            }}
          />
          {preview && preview.content.length > 0 && (
            <Box>
              <Heading size="sm">Preview:</Heading>
              <Box borderWidth={1} borderRadius="md" p="2">
                <ErrorBoundary>
                  <TrustProvider trust>
                    <TextNoteContents event={preview} />
                  </TrustProvider>
                </ErrorBoundary>
              </Box>
            </Box>
          )}
          <Flex gap="2" alignItems="center" justifyContent="flex-end">
            <Flex mr="auto" gap="2">
              <InsertImageButton onUploaded={insertText} aria-label="Upload image" />
              <InsertGifButton onSelectURL={insertText} aria-label="Add gif" />
              <Button
                variant="link"
                rightIcon={moreOptions.isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                onClick={moreOptions.onToggle}
              >
                More Options
              </Button>
            </Flex>
            <Button onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button
              colorScheme="primary"
              type="submit"
              isLoading={formState.isSubmitting}
              onClick={submit}
              isDisabled={!canSubmit}
            >
              Post
            </Button>
          </Flex>
          {moreOptions.isOpen && (
            <Flex direction={{ base: "column", lg: "row" }} gap="4">
              <Flex direction="column" gap="2" flex={1}>
                <Flex gap="2" direction="column">
                  <Switch {...register("nsfw")}>NSFW</Switch>
                  {getValues().nsfw && (
                    <Input {...register("nsfwReason", { required: true })} placeholder="Reason" isRequired />
                  )}
                </Flex>
                <FormControl>
                  <FormLabel>POW Difficulty ({getValues().difficulty})</FormLabel>
                  <Slider
                    aria-label="difficulty"
                    value={getValues("difficulty")}
                    onChange={(v) => setValue("difficulty", v)}
                    min={0}
                    max={40}
                    step={1}
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                  <FormHelperText>
                    The number of leading 0's in the event id. see{" "}
                    <Link href="https://github.com/nostr-protocol/nips/blob/master/13.md" isExternal>
                      NIP-13
                    </Link>
                  </FormHelperText>
                </FormControl>
              </Flex>
              <Flex direction="column" gap="2" flex={1}>
                <ZapSplitCreator
                  splits={getValues().split}
                  onChange={(splits) => setValue("split", splits, { shouldDirty: true })}
                  authorPubkey={account?.pubkey}
                />
              </Flex>
            </Flex>
          )}
        </ModalBody>

        {!addClientTag && promptAddClientTag.isOpen && (
          <Alert status="info" whiteSpace="pre-wrap" flexDirection={{ base: "column", lg: "row" }}>
            <AlertIcon hideBelow="lg" />
            <Text>
              Enable{" "}
              <Link isExternal href="https://github.com/nostr-protocol/nips/blob/master/89.md#client-tag">
                NIP-89
              </Link>{" "}
              client tags and let other users know what app you're using to write notes
            </Text>
            <ButtonGroup ml="auto" size="sm" variant="ghost">
              <Button onClick={promptAddClientTag.onClose}>Close</Button>
              <Button colorScheme="primary" onClick={() => localSettings.addClientTag.next(true)}>
                Enable
              </Button>
            </ButtonGroup>
          </Alert>
        )}
      </>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent>
        {publishAction && <ModalCloseButton />}
        {renderBody()}
      </ModalContent>
    </Modal>
  );
}
