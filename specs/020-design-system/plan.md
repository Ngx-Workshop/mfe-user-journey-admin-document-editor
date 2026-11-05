# Plan: Document editor design system

Status: Complete
Spec: [spec.md](spec.md)
Updated: 2026-11-04

## Source and approach

Working tree clean at start. Design system 21.0.10 configured; builder/webpack compatibility pins already present. Preserve route tree, resolvers, API/state/commands, forms and EditorJS serialized block contract. Add local public NgxPanel composition and viewport helpers. Catalogue rows retain exclusive Devicon/image rendering and sibling edit/delete controls. Metadata forms retain original controls/outputs. Compact section context sits above child action bars. Document editor and page order are independently scrollable, switching panels on small screens.

| Requirement | Affected presentation |
| --- | --- |
| FR-001 | section/workshop catalogues, cards, context header |
| FR-002 | section/workshop/page form presenters |
| FR-003 | workshop detail, editor and ordering presenters |
| FR-004 | galleries/dialogs/previews and static code presenters |
| FR-005 | local panel/viewport helpers and responsive theme scope |

## Constitution check / compatibility

No HTTP/state/contract/route changes. OnPush inline BEM views; ordering uses existing immutable commands. Native ordering containers replace buttons containing links/buttons. Public design-system components/tokens compose Material controls. No sibling runtime dependency or imported style-string arrays. Helpers release observers. Preserve existing card focus/hover action disclosure and long-content scrolling.

## Verification plan

Existing regressions plus focused keyboard ordering and retained editor/preview checks. Full ChromeHeadless, strict app/spec types, check:layout and production to /tmp/document-editor-design-production. Hosted catalogue, metadata validation, mixed page read/preview and panel scroll/width checks on desktop/mobile. Hosted uploader and learner resources remain existing external dependencies; no upload/run/persistence changes required.

## Implementation findings and decisions

Native row containers replace invalid buttons containing links/buttons. Existing ordering commands are now reachable through labelled up/down buttons, and a component regression proves pending suppression, correct mixed-page payload and failure recovery. Compact row links retain full names in title/accessible text while truncating visually. Selecting a page switches the responsive content panel into view.

Six assertions targeted the removed particle/header wrappers or old hardcoded toolbar colors. Updated them to test the new shared toolbar, route links, metadata region, reactive level and exclusive artwork behavior rather than the obsolete styles. Removed three inert unused bindings detected by the strict app check; no API/state behavior changed.

EditorJS content remains the same original blocks and save output. Its consumer wrapper bounds the reading width and uses Material typography tokens plus scoped semantic heading/contenteditable rules; no library-private class names or serialized font data are changed. A few cohesive metadata forms exceed the approximate 230-line target rather than splitting their one responsibility artificially.

The local static server was running without a document-editor watcher. Rebuilt its development bundle after changes, preserving localhost:3007 configuration. Isolated production output stays separate from served dist. No server restart, environment or dependency change required.
