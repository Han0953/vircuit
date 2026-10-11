import { BoardModel, type HardwareResources } from "./hardware-models";

/** Marketing geometry only. Logical pins and simulator dimensions are not changed. */
export function CompactBoard({ type, resources }: { type: "nano" | "esp32"; resources: HardwareResources }) {
  return <BoardModel type={type} resources={resources} />;
}
