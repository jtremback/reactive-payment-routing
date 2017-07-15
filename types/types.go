package types

import (
	"math/big"
)

type Address [20]byte

type Secret [32]byte

type Hash [32]byte

type PaymentInitialization struct {
	Secret [32]byte
	Amount big.Int
}

type RoutingMessage struct {
	Hash   [32]byte
	Amount big.Int
}

type RoutingMessages struct {
	Sequence int
	List     []*RoutingMessage
}

func (rs *RoutingMessages) Clean(num int) {
	rs.Sequence += num
	rs.List = rs.List[num:]
}

func (rs *RoutingMessages) GetSince(index int) []*RoutingMessage {
	index -= rs.Sequence

	if index < 0 {
		index = 0
	}

	return rs.List[index:]
}

type RoutingTableEntry struct {
	NextHop Address
	RoutingMessage
}

type Peer struct {
	MyBalance big.Int
	Address   Address
}
