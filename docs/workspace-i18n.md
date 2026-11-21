# Workspace translations

For text already on screen, `localizedText(element, () => tr(dict, 'key', vars))` from `i18n-client` keeps a live binding without rerunning processing. Bind an empty-string callback when clearing a message. Bind only text-only elements; use a child span when preserving a spinner. Static image descriptions use `data-i18n-alt`. Dropzone accepts `labelKey` and `hintKey` alongside its Indonesian `label` and `hint` props.

Each migrated feature has `src/features/<slug>/i18n.ts`. Export a default
`defineWorkspaceDictionary(id, en)` from `src/lib/i18n.ts`; the ID object defines
the keys and TypeScript requires exactly those keys in EN. Keep values flat.
Dictionary tests discover all these files and check keys, values and variables.

In Astro frontmatter import the dictionary for Indonesian source markup:

```astro
<label for="input" data-i18n="workspace.example.input">{dict.id.input}</label>
<textarea id="input" data-i18n-placeholder="workspace.example.placeholder"
  placeholder={dict.id.placeholder}></textarea>
```

The existing `data-i18n`, `data-i18n-placeholder`, `data-i18n-aria` and
`data-i18n-title` hooks accept `workspace.<slug>.<key>`. Put text hooks on a
text-only child (for example a span), not a parent containing inputs or icons.
The shared client loads dictionaries only for namespaces present on the page.
An unloaded namespace leaves the Indonesian markup intact until it is loaded.

In scripts use `tr(dict, 'key', { n: count })`. It follows the existing language
toggle, including when storage is unavailable. Keep state as keys plus variables
and re-render on `document`'s `lang:change` event. Don't store an already
translated string as persistent state. For visible notifications use
`toast(() => tr(dict, 'copied'))`; callbacks also refresh existing toasts.
Use `textContent` or DOM attribute APIs, not `innerHTML`, for translated values.

Keep user data, samples and technical tokens untouched. Pure logic should return
typed error codes and separate diagnostic details; the UI translates the code.
`format-kode` is the reference for this pattern. Default download names can stay.

For future React migrations, initialize from `currentLang()` on mount, subscribe
to `lang:change` in an effect and remove the listener on unmount. Keep the language
in state so React re-renders. Excalidraw also needs its `langCode` prop set to
`id-ID` or `en`. React islands are not migrated in the first batch.

```sh
node scripts/workspace-i18n-audit.mjs
node scripts/workspace-i18n-audit.mjs --check teks format-kode
```

This audit is a word-based heuristic over workspace/components and supporting
logic (excluding metadata, dictionaries and tests), not a translation extractor.
Counts are lower bounds: short labels and uncommon Indonesian words can be
missed, and samples can be false positives. Review dynamic helpers as well as
markup when migrating another feature. The prompt content directory is excluded.
