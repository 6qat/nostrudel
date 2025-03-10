import { AvatarProps, Text } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import { cashuMintInfo } from "../../services/cashu-mints";

export default function CashuMintName({ mint, ...props }: { mint: string } & Omit<AvatarProps, "src">) {
  const info = useObservable(cashuMintInfo(mint));

  return (
    <Text as="span" {...props}>
      {info?.name || mint}
    </Text>
  );
}
