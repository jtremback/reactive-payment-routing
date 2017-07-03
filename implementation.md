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


