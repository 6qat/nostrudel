import { createIcon } from "@chakra-ui/icons";

const ZoomIn = createIcon({
  displayName: "ZoomIn",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M21 21L16.65 16.65M11 8V14M8 11H14M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      key="EYRg"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ZoomIn;
