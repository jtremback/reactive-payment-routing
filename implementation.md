# Implementation

The readme lays out reactive payment routing in a theoretical sense. This document deals with one possible implementation that might be used in the real world.

The first consideration is that many of the nodes will not have public IP addresses or consistent connectivity. They will need to play the role of a client and poll other nodes ("routing servers"?) for relevant routing messages. These routing servers do not have any different role in the theoretical protocol, they simply are online consistently.

A second consideration is that these "routing clients" may also probably be implemented as "channel clients". That is, they will not sync the blockchain. They will depend on other nodes to check for cheating (trying to close channels with old txs) and post channel opening, channel updating, and channel closing txs to the blockchain for them. They don't need to trust any one full node, they can use several to do these tasks. There can even be a "bounty hunter" arrangement, where nodes can automatically claim a reward for stopping channel cheating.

A third consideration is that due to the small world theory of networks, it will be more efficient for a small number of "superconnector" nodes to route a large proportion of the payments. These superconnectors will likely be powerful servers with full blockchain nodes and public IP addresses.

In some ways, it makes a lot of sense to have roles of routing server, full node, and superconnector be played by the same nodes. At the same time, it does involve some centralization and needs to be managed carefully. For example, 
