import type { Channel } from "discord-types/general";
import { Logger, settings } from "replugged";
import { React, lodash as _, i18n, users } from "replugged/common";
import { Loader, Tooltip } from "replugged/components";
import { waitForProps } from "replugged/webpack";

const { getCurrentUser, getUser, getTrueMember } = users;
const { intl, t } = i18n;

interface Settings {
  hideSelf?: boolean;
  hideOnSelected?: boolean;
  hideOnMuted?: boolean;
}

const defaultSettings: Partial<Settings> = {
  hideSelf: true,
  hideOnSelected: true,
  hideOnMuted: true,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = Logger.plugin("ChannelTyping");

export const cfg = await settings.init<Settings, keyof typeof defaultSettings>(
  "dev.albertp.ChannelTyping",
  defaultSettings,
);

export { Settings } from "./Settings";

interface TypingStore {
  addChangeListener: (fn: () => void) => void;
  removeChangeListener: (fn: () => void) => void;
  getTypingUsers: (channelId: string) => Record<string, string>;
}

interface BlockedStore {
  isBlocked: (userId: string) => boolean;
  isFriend: (userId: string) => boolean;
}

let typingStore: TypingStore;
let blockedStore: BlockedStore;

let stopped = false;
export async function start(): Promise<void> {
  stopped = false;

  typingStore = await waitForProps<TypingStore>("getTypingUsers");
  blockedStore = await waitForProps<BlockedStore>("isBlocked", "isFriend");
}

export function stop(): void {
  stopped = true;
}

function getTooltipText(users: string[], guildId: string): string {
  const members = users.map((id) => getTrueMember(guildId, id));
  const names = _.compact(
    members.map((m) => {
      if (!m) return null;
      if (m.nick) return m.nick;
      const user = getUser(m.userId);
      if (!user) return null;
      return user.username;
    }),
  );

  const count = names.length;

  if (count === 1) return intl.formatToPlainString(t.ONE_USER_TYPING, { a: names[0] });
  if (count === 2)
    return intl.formatToPlainString(t.TWO_USERS_TYPING, { a: names[0], b: names[1] });
  if (count === 3)
    return intl.formatToPlainString(t.THREE_USERS_TYPING, {
      a: names[0],
      b: names[1],
      c: names[2],
    });
  return intl.string(t.SEVERAL_USERS_TYPING);
}

function TypingIndicator({ tooltip }: { tooltip: string }): React.ReactElement | null {
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

function ChannelTyping(props: {
  channel: Channel;
  selected: boolean;
  muted: boolean;
}): React.ReactNode {
  const [typingUsers, setTypingUsers] = React.useState<string[]>([]);

  const updateTypingUsers = (): void => {
    const typingUsers = Object.keys(typingStore.getTypingUsers(props.channel.id)).filter((id) => {
      if (blockedStore.isBlocked(id.toString())) return false;
      if (cfg.get("hideSelf") && id === getCurrentUser().id) return false;
      return true;
    });

    setTypingUsers(typingUsers);
  };

  React.useEffect(() => {
    typingStore.addChangeListener(updateTypingUsers);

    return () => {
      typingStore.removeChangeListener(updateTypingUsers);
    };
  }, []);

  if (stopped) return;

  if (cfg.get("hideOnSelected") && props.selected) return null;
  if (cfg.get("hideOnMuted") && props.muted) return null;

  if (!typingUsers.length) return;

  return <TypingIndicator tooltip={getTooltipText(typingUsers, props.channel.guild_id)} />;
}

export function renderChannelTyping(props: {
  channel: Channel;
  selected?: boolean;
  muted?: boolean;
}): React.ReactNode {
  return (
    <ChannelTyping
      channel={props.channel}
      selected={props.selected || false}
      muted={props.muted || false}
    />
  );
}
