# distribution

This is the distribution library. When loaded, distribution introduces functionality supporting the distributed execution of programs. To download it:

## Installation

```sh
$ npm i '@brown-ds/distribution'
```

This command downloads and installs the distribution library.

## Testing

There are several categories of tests:
  *	Regular Tests (`*.test.js`)
  *	Scenario Tests (`*.scenario.js`)
  *	Extra Credit Tests (`*.extra.test.js`)

### Running Tests

By default, all regular tests are run. Use the options below to run different sets of tests:

1. Run all regular tests (default): `$ npm test` or `$ npm test -- -t`
2. Run scenario tests: `$ npm test -- -c` 
3. Run extra credit tests: `$ npm test -- -ec`
4. Run the `non-distribution` tests: `$ npm test -- -nd`
5. Combine options: `$ npm test -- -c -ec -nd -t`

## Usage

To import the library, be it in a JavaScript file or on the interactive console, run:

```js
let distribution = require("@brown-ds/distribution");
```

Now you have access to the full distribution library. You can start off by serializing some values. 

```js
let s = distribution.util.serialize(1); // '{"type":"number","value":"1"}'
let n = distribution.util.deserialize(s); // 1
```

You can inspect information about the current node (for example its `sid`) by running:

```js
distribution.local.status.get('sid', console.log); // 8cf1b
```

You can also store and retrieve values from the local memory:

```js
distribution.local.mem.put({name: 'nikos'}, 'key', console.log); // {name: 'nikos'}
distribution.local.mem.get('key', console.log); // {name: 'nikos'}
```

You can also spawn a new node:

```js
let node = { ip: '127.0.0.1', port: 8080 };
distribution.local.status.spawn(node, console.log);
```

Using the `distribution.all` set of services will allow you to act 
on the full set of nodes created as if they were a single one.

```js
distribution.all.status.get('sid', console.log); // { '8cf1b': '8cf1b', '8cf1c': '8cf1c' }
```

You can also send messages to other nodes:

```js
distribution.all.comm.send(['sid'], {node: node, service: 'status', method: 'get'}, console.log); // 8cf1c
```
# Results and Reflections
# M1: Serialization / Deserialization

## Summary

> My implementation has 2 main components: one for serializing values and one for deserializing them. I worked on handling many different types of data, including strings, numbers, booleans, objects, arrays, functions, as well as special types like Date and Error objects. I also took care of circular references.


The most difficult challenge I encountered is: "Handling Circular References".
I needed to make sure that objects and arrays that refer back to themselves don’t cause an infinite loop. I solved this by using a WeakMap to store and check objects that had already been processed.

## Correctness & Performance Characterization


> Describe how you characterized the correctness and performance of your implementation


*Correctness*: I wrote `11` tests; these tests take `0.2s` to execute. This includes `1. function 2. date object 3. rrror object 4. nested object 5. array with mixed types 6. empty structures 7. 5 basic data types(string, number, boolean, undefined, null)`.


*Performance*: The latency of various subsystems is described in the `"latency"` portion of package.json. The characteristics of my development machines are summarized in the `"dev"` portion of package.json.

# M2: Actors and Remote Procedure Calls (RPC)


## Summary
My implementation comprises 3 software components, totaling 150 lines of code.

One of the key challenges I faced were:
 Handling Remote Communication – I had to ensure that my comm module correctly sent and received messages between nodes. At first, my requests failed because the data format was incorrect. This was caused by inconsistant data format: some messages are serialized by JSON.stringfy and some of them are converted by the serialize function in M1. I fixed this by carefully structuring the JSON payload with functions in mile stone 1 and making sure the server properly parsed it.

## Correctness & Performance Characterization

*Correctness*: I wrote 6 tests; these tests take `0.275` to execute.


*Performance*: I characterized the performance of `comm` by sending 1000 service requests in a tight loop. Average throughput and latency is recorded in `package.json`'s m2 section.

# M3: Node Groups & Gossip Protocols


## Summary

> 


My implementation comprises `5` new software components and updated `3` mudoles from previous milestone, totaling `300` added lines of code over the previous implementation. 

This milestone was the most challenging one. I spent over 25 hours on it. I got stuck at T4 because I hadn't implemented the spawn section. Integrating the system library without causing conflicts with my previous implementation was really troublesome.

The second challenge was locating a bug in the comm.all service. For the second test of comm.all, the test case expected us to return empty when the error was null. However, in my initial implementation, I returned with Error. I spent a lot of time figuring out why the test case failed. It's clear now that I need to better understand the interactions between each components and make sure to attend office hours earlier next time.

## Correctness & Performance Characterization

> 
*Correctness* -- I write 5 more tests and it takes 0.262s to run. 

*Correctness* -- Spawn time: About 0.194 s per node.

## Key Feature

> What is the point of having a gossip protocol? Why doesn't a node just send the message to _all_ other nodes in its group?

The gossip protocol is useful because it helps spread information in a large network without overwhelming the system. If a node sent messages to all other nodes at once, it would create too much network traffic and slow everything down. Instead, with gossip, a node only tells a few random nodes, and they pass the message to others. This way, the message still reaches everyone, but more efficiently and without overloading the network.


# M4: Distributed Storage
## Summary
I implemented a distributed key-value storage system, including local and distributed memory and storage services. I also added scalable hash functions and tested everything with different scenarios. Finally, I deployed the system on AWS and measured its performance. Two key challenges were handling data distribution across multiple nodes and ensuring correct error handling when retrieving non-existent keys.

## Correctness & Performance Characterization

*Correctness* -- I added 5 more student tests, taking 0.385 seconds to run. All 35 tests related to "store local" and "store all" passed, taking approximately 1.534 seconds. Additionally, 31 mem tests passed in 1.412 seconds.

*Performance* -- The performance on AWS nodes and the local device is documented in the "m4" section of the package.json file.


## Key Feature

> Why is the `reconf` method designed to first identify all the keys to be relocated and then relocate individual objects instead of fetching all the objects immediately and then pushing them to their corresponding locations?