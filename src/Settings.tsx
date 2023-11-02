import { cfg } from ".";
import { util } from "replugged";
import { SwitchItem } from "replugged/components";

export function Settings(): React.ReactElement {
  return (
    <div>
      <SwitchItem
        note="Typing indicators won't be shown if you're the only one typing."
        {...util.useSetting(cfg, "hideSelf")}>
        Hide yourself
      </SwitchItem>
      <SwitchItem {...util.useSetting(cfg, "hideOnSelected")}>Hide on selected channel</SwitchItem>
      <SwitchItem {...util.useSetting(cfg, "hideOnMuted")}>Hide on muted channels</SwitchItem>
    </div>
  );
}
