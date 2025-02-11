import type { PlaintextPatch } from "replugged/types";

const pluginExports = "window.replugged.plugins.getExports('dev.albertp.ChannelTyping')";

const patches: PlaintextPatch[] = [
  {
    find: /renderChannelInfo\(\){/,
    replacements: [
      {
        match: /(\w+)(\.renderChannelInfo\(\))(])/g,
        replace: (_, variable, prefix, suffix) => {
          return `${variable}${prefix}, ${pluginExports}?.renderChannelTyping(${variable}.props)${suffix}`;
        },
      },
    ],
  },
];

export default patches;
