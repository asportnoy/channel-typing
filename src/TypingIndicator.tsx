import { components } from "replugged";
const { Loader, Tooltip } = components;

type Tooltip = React.FC<{
  text: string;
  children: React.FC;
  hideOnClick?: boolean;
  position?: string;
  color?: string;
  forceOpen?: boolean;
  hide?: boolean;
  spacing?: number;
  shouldShow?: boolean;
  allowOverflow?: boolean;
}>;

export default function TypingIndicator({
  tooltip,
}: {
  tooltip: string;
}): React.ReactElement | null {
  return (
    <Tooltip text={tooltip} style={{ cursor: "pointer" }}>
      <div
        className="channel-typing-indicator"
        style={{
          height: 16,
          display: "flex",
          alignItems: "center",
          marginLeft: 5,
          opacity: 0.7,
        }}>
        <Loader type="pulsingEllipsis" animated={true}></Loader>
      </div>
    </Tooltip>
  );
}
