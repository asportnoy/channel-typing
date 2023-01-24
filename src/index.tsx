/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { Channel } from "discord-types/general";
import { Injector, Logger, common, settings, util, webpack } from "replugged";
import type { ModuleExportsWithProps } from "replugged/dist/types";
import TypingIndicator from "./TypingIndicator";
const { waitForModule, filters, getExportsForProps } = webpack;
const {
  React,
  lodash: { compact, isObject },
  users: { getCurrentUser, getUser, getTrueMember },
} = common;
const { forceUpdateElement } = util;

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

const logger = Logger.plugin("Channel Typing");

export const cfg = await settings.init<Settings, keyof typeof defaultSettings>(
  "dev.albertp.ChannelTyping",
  defaultSettings,
);

export { Settings } from "./Settings";

const inject = new Injector();

async function waitForProps<
  Props extends string,
  Exports extends ModuleExportsWithProps<Props> = ModuleExportsWithProps<Props>,
>(...props: Props[]): Promise<Exports> {
  const mod = await waitForModule(filters.byProps(...props), { timeout: 10 * 1000 });
  const exports = getExportsForProps<Props, Exports>(mod, props);
  return exports!;
}

function findInTree(
  tree: Record<string, unknown> | unknown[],
  filter: string | ((obj: unknown) => boolean),
): unknown | null {
  if (!tree || typeof tree !== "object") {
    return null;
  }

  if (typeof filter === "string") {
    if (!Array.isArray(tree) && filter in tree) {
      return tree[filter];
    }

    return null;
  } else if (filter(tree)) {
    return tree;
  }

  const children: unknown[] = Array.isArray(tree)
    ? tree
    : Object.entries(tree)
        .filter(([k]) => ["props", "children", "child", "sibling"].includes(k))
        .map(([, v]) => v);

  const match = children
    .filter((child) => Array.isArray(child) || isObject(child))
    .map((child) => findInTree(child as Record<string, unknown> | unknown[], filter))
    .find(Boolean);
  return match ?? null;
}

let wrapperClass: string;

function typingChange(): void {
  forceUpdateElement(`.${wrapperClass}`, true);
}

type ChannelProps = { channel: Channel; className: string; selected: boolean; muted: boolean };

type TypingStore = {
  addChangeListener: (fn: () => void) => void;
  removeChangeListener: (fn: () => void) => void;
  getTypingUsers: (channelId: string) => Record<string, string>;
};

type BlockedStore = {
  isBlocked: (userId: string) => boolean;
  isFriend: (userId: string) => boolean;
};

type MessageFn = {
  message: string;
  format: (args: Record<string, string>) => string;
};

type Messages = Record<string, string | MessageFn>;

let removeChangeListener: () => void;

let Messages: Messages;

export async function start(): Promise<void> {
  const typingStore = await waitForProps<keyof TypingStore, TypingStore>("getTypingUsers");
  if (!typingStore) {
    logger.error("Failed to find typing store");
    return;
  }
  const blockedStore = await waitForProps<keyof BlockedStore, BlockedStore>(
    "isBlocked",
    "isFriend",
  );
  if (!blockedStore) {
    logger.error("Failed to find blocked users store");
    return;
  }
  const i18n = webpack
    .getByProps<"Messages", { Messages: Messages }>(["Messages"], { all: true })
    .find((x) => x.Messages.ACCOUNT);
  if (!i18n) {
    logger.error("Failed to find i18n module");
    return;
  }
  Messages = i18n.Messages;

  wrapperClass = webpack.getByProps("wrapper", "modeUnread")?.wrapper as string;
  if (!wrapperClass) {
    logger.error("Failed to find wrapper class");
    return;
  }

  logger.log("Found all modules!");

  typingStore.addChangeListener(typingChange);
  removeChangeListener = () => typingStore.removeChangeListener(typingChange);

  const channelItem: { [k: string]: React.FC<ChannelProps> } = await webpack.waitForModule(
    filters.bySource("().favoriteSuggestion"),
  );
  const reactFn = webpack.getFunctionKeyBySource("().favoriteSuggestion", channelItem);
  if (!reactFn || typeof reactFn !== "string") return;

  inject.after(channelItem, reactFn, ([args], res) => {
    if (cfg.get("hideOnSelected") && args.selected) return;
    if (cfg.get("hideOnMuted") && args.muted) return;

    const child = findInTree(res as unknown as Record<string, unknown>, (n) => {
      if (!isObject(n)) return false;
      const obj = n as Record<string, unknown>;
      if (!("className" in obj)) return false;
      if (typeof obj.className !== "string") return false;
      return obj.className.startsWith("children-");
    }) as React.PropsWithChildren<{ children: React.ReactElement[] }> | null;

    const typingUsers = Object.keys(typingStore.getTypingUsers(args.channel.id)).filter((id) => {
      if (blockedStore.isBlocked(id.toString())) return false;
      if (cfg.get("hideSelf") && id === getCurrentUser().id) return false;
      return true;
    });

    if (!typingUsers.length) return;

    if (child) {
      if (!child.children.some((x) => x.type === TypingIndicator)) {
        child.children.push(
          <TypingIndicator
            tooltip={getTooltipText(typingUsers, args.channel.guild_id)}></TypingIndicator>,
        );
      }
    }
  });
}

function getTooltipText(users: string[], guildId: string): string {
  const members = users.map((id) => getTrueMember(guildId, id));
  const names = compact(
    members.map((m) => {
      if (!m) return null;
      if (m.nick) return m.nick;
      const user = getUser(m.userId);
      if (!user) return null;
      return user.username;
    }),
  );

  const count = names.length;

  if (count === 1) return (Messages.ONE_USER_TYPING as MessageFn).format({ a: names[0] });
  if (count === 2)
    return (Messages.TWO_USERS_TYPING as MessageFn).format({ a: names[0], b: names[1] });
  if (count === 3)
    return (Messages.THREE_USERS_TYPING as MessageFn).format({
      a: names[0],
      b: names[1],
      c: names[2],
    });
  return Messages.SEVERAL_USERS_TYPING as string;
}

export function stop(): void {
  inject.uninjectAll();
  removeChangeListener();
}
