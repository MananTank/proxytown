# proxytown 🎉

Alternate Implementation of [partytown](https://github.com/BuilderIO/partytown) library with automatic cross-thread global variables support

<br/>

## Features

- Run third party scripts in worker thread 🥳
- thirdy party scripts can still use DOM API and global variables defined in main thread automatically.
- Any globals created in worker thread is also be usable in main thread automatically.
- scripts created and inserted by thirdy party scripts gets executed in worker thread automatically.
- Lightweight (6KB for all files combined)

<br/>

## Setup

Get the Proxytown folder from [here](https://kj1rqk.csb.app/) (Select either specific version or latest)

Move this folder in your project, and use the proxytown iframe in your page

```html
<iframe hidden src="path/to/proxytown/proxytown.html"> </iframe>
```

Set `type="text/proxytown"` on third party scripts that you wish to run in proxytown's worker thread

```html
<script type="text/proxytown" src="path/to/third-party-script"></script>
```

Checkout this [sandbox](https://codesandbox.io/s/7ebxo6?file=/index.html) for example

<br/>

## Not Production Ready !

It's still in development 🛠
