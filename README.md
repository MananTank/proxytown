# Proxytown 🎉

Alternate Implementation of [partytown](https://github.com/BuilderIO/partytown) library with automatic cross-thread global variables support

<br/>

## Features

Run third-party scripts in the worker thread 🥳

- third party scripts can still use DOM API and global variables defined in the main thread automatically.
- Any globals created in the worker thread are also usable in the main thread automatically.
- scripts created and inserted by third-party scripts get executed in the worker thread automatically.
- Lightweight (6KB for all files combined)

<br/>

## Setup

Get the Proxytown folder from [proxytown-download.pages.dev](https://proxytown-download.pages.dev/)

(specify either a specific version or go for the latest)

Move this folder in your project, and use the the Proxytown iframe in your page

```html
<iframe hidden src="path/to/proxytown/proxytown.html"> </iframe>
```

Set `type="text/proxytown"` on third-party scripts that you wish to run in Proxytown's worker thread

```html
<script type="text/proxytown" src="path/to/third-party-script"></script>
```

Checkout this [sandbox](https://codesandbox.io/s/7ebxo6?file=/index.html) for example

<br/>

## Not Production Ready!

It's still in development 🛠
