import { types } from "replugged";

const pluginExports = "window.replugged.plugins.getExports('dev.albertp.ChannelTyping')";

const patches: types.PlaintextPatch[] = [
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
