package logic

import (
	"math/big"

	"github.com/jtremback/reactive-payment-routing/types"
)

var myFee = 1

type Logic struct {
	RoutingTable    map[types.Hash]*types.RoutingTableEntry
	RoutingMessages *types.RoutingMessages
}

func (self *Logic) GiveMessageByHash(hash types.Hash) *types.RoutingMessage {
	r, exists := self.RoutingTable[hash]
	if exists {
		return &r.RoutingMessage
	}
	return nil
}

func (self *Logic) GiveMessagesSinceSeq(i int) []*types.RoutingMessage {
	return self.GiveMessagesSinceSeq(i)
}

func (self *Logic) ProcessMessages(p *types.Peer, ms []*types.RoutingMessage) {
	var allocatedBalance *big.Int
	var availableBalance *big.Int

	for i := len(ms) - 1; i >= 0; i-- {

		availableBalance.Sub(&p.MyBalance, allocatedBalance)

		// Check if channel to peer has enough
		if availableBalance.Cmp(&ms[i].Amount) > 0 {
			continue
		}

		// Try to get existing message from table
		m, exists := self.RoutingTable[ms[i].Hash]

		// Check if new amount is lower
		if exists && m.Amount.Cmp(&ms[i].Amount) > 0 {
			continue
		}

		// Add to routing table
		self.RoutingTable[ms[i].Hash].RoutingMessage = *ms[i]
		self.RoutingTable[ms[i].Hash].NextHop = p.Address

		// Adjust amount
		ms[i].Amount.Add(&ms[i].Amount, big.NewInt(int64(myFee)))

		// Adjust allocated balance
		allocatedBalance.Add(allocatedBalance, &ms[i].Amount)

		// Put into RoutingMessageQueue
		self.RoutingMessages.List = append(self.RoutingMessages.List, ms[i])
	}
}
