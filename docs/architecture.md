# Architecture

- mark the scripts which should run in the worker thread
- for each such script
  - blob file is created which contains the content of the script but wrapped in a try block
  - to catch and report the errors
  - any script added from these scripts to document also treated the same way
- since the worker thread does not have access to many DOM apis they are proxied
  - get operations for their properties are requested from main thread
    - main thread only sends the actual value if it's sharable
    - other wise it just sends the reference to it, which worker creates a proxy for it - called `mainProxy`
  - set operations on the proxy are done directly in the proxy object, so that when it's time to get it - there wont be any need to ask main thread for it
    - and this is also sent to main thread so that it also performs this operation
    - if the set value is not sharable to main thread, only a reference to it is sent to the main thread
    - main thread then creates a proxy for it - called `workerProxy` which can handle mutations done in the main thread
    - this allows no-config setup where we don't have to specify which globals are defined by the code in worker and main thread can use them like they are defined in the main thread itself - useful for datalayer.push kinda scenarios.
  - other than these, we also trap other operations as well
