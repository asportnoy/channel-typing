import { common, webpack } from "replugged";
const { getBySource, getFunctionBySource } = webpack;
const { React } = common;

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

function tooltipMod(): Tooltip | null {
  const mod = getBySource(".state={shouldShowTooltip:!1}");
  if (!mod || typeof mod !== "object") return null;
  return getFunctionBySource(".state={shouldShowTooltip:!1}", mod) as Tooltip | null;
}

export default function TypingIndicator({
  tooltip,
}: {
  tooltip: string;
}): React.ReactElement | null {
  const mod = getBySource("pulsingEllipsis");
  if (!mod || typeof mod !== "object") return null;
  const Spinner = Object.values(mod).find((x) => typeof x === "function") as React.FC<{
    type: string;
    animated?: boolean;
  }> | null;
  if (!Spinner) return null;
  const Tooltip = tooltipMod();
  if (!Tooltip) return null;

  return (
    <Tooltip text={tooltip}>
      {(props) => (
        <div
          {...props}
          className="channel-typing-indicator"
          style={{
            height: 16,
            display: "flex",
            alignItems: "center",
            marginLeft: 5,
            opacity: 0.7,
          }}>
          <Spinner type="pulsingEllipsis" animated={true}></Spinner>
        </div>
      )}
    </Tooltip>
  );
}
