import type { PlaintextPatch } from "replugged/types";

const pluginExports = "window.replugged.plugins.getExports('dev.albertp.ChannelTyping')";

const patches: PlaintextPatch[] = [
  {
    find: /isNewChannel:\w+&&\w+\.canBeNewChannel/,
    replacements: [
      {
        match: /(\w+)(\.renderChannelInfo\(\))/g,
        replace: (_, variable, prefix) => {
          return `${variable}${prefix}, ${pluginExports}?.renderChannelTyping(${variable}.props)`;
        },
      },
    ],
  },
];

export default patches;
