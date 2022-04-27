# proxytown 🎉

Alternate Implementation of [partytown](https://github.com/BuilderIO/partytown) library with automatic cross-thread global variables support

<br/>

## Features

- Run third party scripts in worker thread 🥳
- Even though it's running in worker thread, these scripts can use DOM API and global variables defined in main thread
- Any globals created in worker thread can also usable in main thread without any config
- Scripts created and inserted by these party scripts also gets executed in worker thread
- Lightweight (6KB for all files combined)

<br/>

## Setup

Get the Proxytown folder from [here](https://kj1rqk.csb.app/) (Select either specific version or latest)

Move this folder in your project, and use the proxytown iframe in your page

```html
<iframe hidden src="path/to/proxytown/proxytown.html"> </iframe>
```

Set `type="text/proxytown"` on third party scripts that you wish to run in worker thread

```html
<script type="text/proxytown" src="path/to/third-party-script"></script>
```

Checkout this [sandbox](https://7ebxo6.csb.app/) for example

<br/>

## Not Production Ready Yet !

This is currently just a proof of concept is not well tested.
