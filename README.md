# Channel Typing

Show typing indicators in the channel list.

# Settings

Set settings from the console using:

```js
(await replugged.settings.init("dev.albertp.ChannelTyping")).set(key, value);
```

| Key              | Description                                | Default |
| ---------------- | ------------------------------------------ | ------- |
| `hideSelf`       | Do not show indicator for yourself         | `true`  |
| `hideOnSelected` | Do not show indicator for selected channel | `true`  |
| `hideOnMuted`    | Do not show indicator for muted channels   | `true`  |
