# proxytown 🎉

Alternate Implementation of partytown library with automatic cross-thread global variables support.

<br/>

## Features

- Run third party scripts in worker thread
  - Scripts can use DOM API
  - Scripts can use global variables defined in main thread
  - Any globals created in worker thread also usable in main thread without any config
  - Scripts created and inserted by third party scripts also gets executed in worker thread

<br/>

## Setup

Execute below command where you want to copy the proxytown folder.

```bash
npx proxytown
```

Add the proxytown iframe in the html document

```html
<iframe hidden src="path/to/proxytown/proxytown.html"> </iframe>
```

add `type="text/proxytown"` on third party scripts that you wish to run in worker thread

```html
<script type="text/proxytown" src="path/to/third-party-script"></script>
```

Example:
