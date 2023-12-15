import { Button, IconButton } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";

import UserAvatar from "../../../components/user-avatar";
import { Thread } from "../../../providers/thread-provider";
import { ChevronRightIcon, ThreadIcon } from "../../../components/icons";
import { IconButtonProps } from "yet-another-react-lightbox";
import { NostrEvent } from "../../../types/nostr-event";

export default function ThreadButton({ thread }: { thread: Thread }) {
  const navigate = useNavigate();
  const location = useLocation();

  const onClick = () => {
    navigate(`.`, { state: { ...location.state, thread: thread.rootId } });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      leftIcon={<UserAvatar pubkey={thread.messages[thread.messages.length - 1].pubkey} size="xs" />}
      rightIcon={<ChevronRightIcon />}
      onClick={onClick}
    >
      {thread.messages.length} replies
    </Button>
  );
}

export function IconThreadButton({
  event,
  ...props
}: { event: NostrEvent } & Omit<IconButtonProps, "aria-label" | "icon">) {
  const navigate = useNavigate();
  const location = useLocation();

  const onClick = () => {
    navigate(`.`, { state: { ...location.state, thread: event.id } });
  };

  return (
    <IconButton
      icon={<ThreadIcon />}
      onClick={onClick}
      aria-label="Reply in thread"
      title="Reply in thread"
      {...props}
    />
  );
}
