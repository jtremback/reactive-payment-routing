# Implementation

The readme lays out reactive payment routing in a theoretical sense. This document deals with one possible implementation that might be used in the real world.

The first consideration is that many of the nodes will not have public IP addresses or consistent connectivity. They will need to play the role of a client and poll other nodes ("routing servers"?) for relevant routing messages. These routing servers do not have any different role in the theoretical protocol, they simply are online consistently.

A second consideration is that these "routing clients" may also probably be implemented as "channel clients". That is, they will not sync the blockchain. They will depend on other nodes to check for cheating (trying to close channels with old txs) and post channel opening, channel updating, and channel closing txs to the blockchain for them. They don't need to trust any one full node, they can use several to do these tasks. There can even be a "bounty hunter" arrangement, where nodes can automatically claim a reward for stopping channel cheating.

A third consideration is that due to the small world theory of networks, it will be more efficient for a small number of "superconnector" nodes to route a large proportion of the payments. These superconnectors will likely be powerful servers with full blockchain nodes and public IP addresses.

In some ways, it makes a lot of sense to have roles of routing server, full node, and superconnector be played by the same nodes. At the same time, it does involve some centralization and needs to be managed carefully. For example, there's no point in having the same node play both the role of full node and superconnector for a given client node. This is because this node would be tasked with keeping itself from cheating, which is silly. A given client node is better off using a collection of other unrelated full nodes in addition to its chosen superconnector. If all the full nodes in the set colluded, this could still result in the client node being ripped off.

However, superconnectors and routing servers will be one and the same, since routing messages are propagated between nodes that have open channels.

## Routing server

The readme calls for nodes to send each other routing messages containing the hash of the payment secret. Given that client nodes can not receive messages, this will need to be adjusted. Client nodes will need to poll their chosen routing server. One way to do this would be to receive all messages, then select only the ones with the desired payment secret hash. More efficient would be to send the payment secret hash in the polling request and then receive only the routing message that matches.

So, given a network

```
A---B---D---E
     \ /
      C
```

where A and E are client nodes and B, C and D are servers.

When A wants to send D a payment, A first sends E the payment secret and the amount. D then hashes the payment secret and sends C and E the routing message. C and E then send it to B. A polls B with the payment hash. When B receives the a routing message from C or E, it passes it on to A. When A is satisified that it has waited long enough to get the best route, it sends the payment as detailed in readme.md.

## Payment initialization delivery

Another consideration: how does the payment initialization get to the recipient, if the recipient is a client node? There are 2 possibilities: out of band, and a purpose-built payment initialization messaging system.

In the out-of-band technique, the sender sends the recipient the routing initialization message in a text message or something. The recipient then enters the information into their client software, at which point the routing protocol process starts. 

If we take on the responsibility of delivering the initialization message ourselves, we have to remember that we can't send messages directly to client nodes. Full nodes could store encrypted payment initialization messages for delivery to client nodes. Full nodes might be incentivized to deliver these messages because it would indirectly result them processing a payment. This could be done by sending payment initialization messages directly to full nodes known to be connected to the destination client node (a little like email). It could also be done by flooding the network. This is a little more similar to AODV, where the initial message is flooded. It could also be done using a DHT. 

It's probably easiest to just do it out of band at first.

## Routing message queueing 

This protocol is modeled as individual routing messages being exchanged. In practice, it is probably more efficient for routing messages to be bundled up and sent together once every second or few seconds. This is especially true if using http, json and gzip.

When receiving a bundle of routing messages, the node will iterate through the bundle and perform the steps listed in readme.md for each message. When finished, new routing messages are added into a queue instead of being sent out immediately.

Every X seconds, the queue is emptied.

## Node identification

The routing table needs to store an entry about who the next-hop node is. Using the same ethereum addresses that are used to sign messages is probably an ok way to identify nodes. Nodes also need to be able to send each other messages, however clients are not able to receive messages. For this reason, it would probably be better to have a secondary mapping of ethereum addresses to IP addresses of server nodes. This way 

## Entities

### Payment initialization
```
{
     secret: <payment secret>,
     amount: <number of tokens>
}
```

### Routing message
```
{
     hash: <payment secret hash>,
     amount: <number of tokens>
}
```

### Routing message bundle
```
{
     seq: <sequence number for bundle>,
     messages: [
          <routing messages>
     ]
}
```

## Data structures

### Routing table
```
{
     [hash]: {
          nextHop: 
     }
}
```

### Routing message queue
```
[
     <routing messages>
]
```

### Routing message bundle store
```
{
     [sequence number]: <routing message>
}
```

## API

### GET /messagesByHash/\<hash\>

Called to request routing messages with \<hash\>. Will probably be used mostly by clients.

### GET /messageBundles/\<starting seq\>/\<ending seq\>

Called to get bundles of the latest routing messages. Will probably be used mostly by servers.
