# Loop Dungeon Android

This is a thin Android WebView wrapper around the existing web game.

The web files remain the source of truth at the repository root. During an
Android build, `:app:syncWebAssets` copies these files into
`app/src/main/assets`:

- `index.html`
- `howto.html`
- `game.js`
- `style.css`
- `sozai/`
- `stage/`
- `tutorial/`

Open the `android/` folder in Android Studio and run the `app` configuration.
