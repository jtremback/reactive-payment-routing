// const ui = require('./ui.js')
const randomGraph = require('randomgraph')
const sha3 = require('js-sha3')

const tm = 100
const cardLength = 10
const cardDepth = 10

let numberOfForwards = 0
let numberProcessed = 0

function graph2network (graph) {
  let nodes = graph.nodes.reduce((acc, item, index) => {
    let node = {
      ipAddress: index,
      exchangeRates: {
        'USD/EUR': '1/2',
        'EUR/USD': '2/1'
      },
      fee: {
        amount: 0.01,
        denomination: 'USD'
      },
      channels: {}
    }

    acc[index + ''] = node
    return acc
  }, {})

  for (let edge of graph.edges) {
    let channelId = hashFn(Math.random())
    let denomination = Math.random() > 0.5 ? 'USD' : 'EUR'
    nodes[edge.source].channels[edge.target] = {
      channelId,
      ipAddress: edge.target,
      denomination: denomination,
      myBalance: 10,
      theirBalance: 10
    }

    nodes[edge.target].channels[edge.source] = {
      channelId,
      ipAddress: edge.source,
      denomination: denomination,
      myBalance: 10,
      theirBalance: 10
    }
  }

  for (let ipAddress in nodes) {
    let node = nodes[ipAddress]
    let newChannels = {}

    for (let key in node.channels) {
      let channel = node.channels[key]

      newChannels[channel.channelId] = channel
    }

    node.channels = newChannels
  }
  return { nodes }
}

function hashFn (secret) {
  return sha3.keccak_224(String(secret)).slice(0, 10) // truncate for ease of reading
}



//          fromChannel
//       $receiveAmount
//            \
//      fromChannel-$receiveAmount-(node)-$sendAmount--> toChannel
//            /
//       $receiveAmount
//          fromChannel
//   toChannel has a one-to-many relationship with fromChannels
//   Another routing message that is received with the same hash and a lower
//   sendAmount will override this one.

// node: {
//   routingTable: {
//     [hash]: {
//       hash,
//       toChannel,
//       sendAmount, // This is how much the next step must recieve to
//                   // convey the payment further. Non-negotiable.
//       fromChannels: {
//         [channelId]: {
//           receiveAmount // We determine this
//         }
//       },
//     }
//   },

//   exchangeRates: {
//     ['asset' + '/' + 'asset']: 'numerator' + '/' + 'denominator',
//   },

//   fee: {
//     amount,
//     denomination
//   }

//   // Source has these
//   // These are created by initializeRoute and checked by forwardRoutingMessage
//   pendingRoutes: {
//     [hash]: {
//       secret,
//     }
//   },

//   // Destination has these
//   // These are created by sendRoutingMessage and checked by receivePayment
//   pendingPayments: {
//     [hash]: {
//       secret,
//     }
//   },

//   channels: {
//     [channelId]: {
//       channelId,
//       ipAddress,
//       denomination,
//       myBalance,
//       theirBalance
//     }
//   }
// }

// routingMessage: {
//   hash: xyz123,
//   amount: 100,
//   channelId: A
// }

// hashlockedPayment: {
//   hash: xyz123,
//   amount: 100,
//   channelId: A
// }


let smallRandomGraph = graph2network(randomGraph.BarabasiAlbert(100, 1, 1))

let basicGraph = {
  nodes: {
    0: {
      ipAddress: 0,
      exchangeRates: {
        'USD/EUR': '1/1',
        'EUR/USD': '1/1'
      },
      fee: {
        amount: 0.00,
        denomination: 'USD'
      },
      channels: {
        A: {
          channelId: 'A',
          ipAddress: 2,
          denomination: 'USD',
          myBalance: 20,
          theirBalance: 10
        },
        B: {
          channelId: 'B',
          ipAddress: 1,
          denomination: 'EUR',
          myBalance: 5,
          theirBalance: 10
        },
        E: {
          channelId: 'E',
          ipAddress: 4,
          denomination: 'USD',
          myBalance: 10,
          theirBalance: 10
        }
      }
    },
    1: {
      ipAddress: 1,
      exchangeRates: {
        'USD/EUR': '1/2',
        'EUR/USD': '2/1'
      },
      fee: {
        amount: 0.00,
        denomination: 'USD'
      },
      channels: {
        B: {
          channelId: 'B',
          ipAddress: 0,
          denomination: 'EUR',
          myBalance: 10,
          theirBalance: 5
        },
        C: {
          channelId: 'C',
          ipAddress: 2,
          denomination: 'USD',
          myBalance: 30,
          theirBalance: 40
        }
      }
    },
    2: {
      ipAddress: 2,
      exchangeRates: {
        'USD/EUR': '1/1',
        'EUR/USD': '1/1'
      },
      fee: {
        amount: 0.00,
        denomination: 'USD'
      },
      channels: {
        A: {
          channelId: 'A',
          ipAddress: 0,
          denomination: 'USD',
          myBalance: 10,
          theirBalance: 20
        },
        C: {
          channelId: 'C',
          ipAddress: 1,
          denomination: 'USD',
          myBalance: 40,
          theirBalance: 30
        },
        D: {
          channelId: 'D',
          ipAddress: 3,
          denomination: 'USD',
          myBalance: 30,
          theirBalance: 10
        }
      }
    },
    3: {
      ipAddress: 3,
      exchangeRates: {
        'USD/EUR': '1/1',
        'EUR/USD': '1/1'
      },
      fee: {
        amount: 0.00,
        denomination: 'USD'
      },
      channels: {
        D: {
          channelId: 'D',
          ipAddress: 2,
          denomination: 'USD',
          myBalance: 10,
          theirBalance: 30
        }
      }
    },
    4: {
      ipAddress: 4,
      exchangeRates: {
        'USD/EUR': '1/1',
        'EUR/USD': '1/1'
      },
      fee: {
        amount: 0.00,
        denomination: 'USD'
      },
      channels: {
        E: {
          channelId: 'E',
          ipAddress: 0,
          denomination: 'USD',
          myBalance: 10,
          theirBalance: 10
        }
      }
    }
  }
}

function channelChecker (nodes) {
  for (let ipAddress in nodes) {
    let node = nodes[ipAddress]
    for (let channelId in node.channels) {
      let myChannel = node.channels[channelId]
      let neighbor = nodes[myChannel.ipAddress]
      if (!neighbor) {
        throw new Error(ipAddress + ' ' + myChannel.channelId + ' ' + '!neighbor')
      }

      let theirChannel = neighbor.channels[myChannel.channelId]
      if (!theirChannel) {
        throw new Error(ipAddress + ' ' + myChannel.channelId + ' ' + '!theirChannel')
      }
      if (node.ipAddress !== theirChannel.ipAddress) {
        throw new Error(ipAddress + ' ' + myChannel.channelId + ' ' + 'node.ipAddress !== theirChannel.ipAddress' + ' ' + node.ipAddress + ' ' + theirChannel.ipAddress)
      }
      if (myChannel.myBalance !== theirChannel.theirBalance) {
        throw new Error(ipAddress + ' ' + myChannel.channelId + ' ' + 'myChannel.myBalance !== theirChannel.theirBalance' + ' ' + myChannel.myBalance + ' ' + theirChannel.theirBalance)
      }
      if (myChannel.theirBalance !== theirChannel.myBalance) {
        throw new Error(ipAddress + ' ' + myChannel.channelId + ' ' + 'myChannel.theirBalance !== theirChannel.myBalance' + ' ' + myChannel.theirBalance + ' ' + theirChannel.myBalance)
      }
    }
  }
}

function initNodes (network) {
  for (let ipAddress in network.nodes) {
    let node = network.nodes[ipAddress]

    node.ipAddress = ipAddress
    node.routingTable = {}
    node.pendingRoutes = {}
    node.pendingPayments = {}
  }
}


function exchange (self, { amount, from, to }) {
  if (from === to) {
    return amount
  } else {
    let [numerator, denominator] = self.exchangeRates[from + '/' + to]
                                   .split('/').map(n => Number(n))

    return amount * (numerator / denominator)
  }
}

function transmit (fn) {
  setTimeout(fn, (Math.random() * tm) + tm)
}


// Steps when initializing payment:
// 1. Send payment initialization to destination
// 2. Record details in pendingRoutes.
//    - hash
function initializePayment (self, destination, { amount, denomination }) {
  let secret = String(Math.random()).slice(2)
  let hash = hashFn(secret)

  self.pendingRoutes[hash] = {
    secret
  }

  transmit(() => {
    // This is what the destination does when it gets the payment initialization
    sendRoutingMessage(destination, { secret, amount, denomination })
  })
}

// Steps when sending a routing message:
// 1. Record details in pendingPayments.
//    - secret
// 2. Determine prices for neighbors
// 3. Send to neighbors with enough money
// 4. Record details in routingTable
//    - hash
//    - fromChannels
//      - channelId
//      - receiveAmount
function sendRoutingMessage (self, { secret, amount, denomination }) {
  console.log(self.ipAddress, 'sent routing message', { secret, amount, denomination })
  let hash = hashFn(secret)

  // Create pendingPayments entry
  self.pendingPayments[hash] = {
    secret
  }

  // Create routingTable entry
  let route = {
    hash,
    fromChannels: {}
  }

  // Iterate through channels
  for (let fromChannelId in self.channels) {
    let fromChannel = self.channels[fromChannelId]

    // Convert to fromChannel's denomination
    let newAmount = exchange(self, { amount, from: denomination, to: fromChannel.denomination })

    // If they have enough in their side of the channel
    if (fromChannel.theirBalance > amount) {
      transmit(() => {
        forwardRoutingMessage(network.nodes[fromChannel.ipAddress], {
          hash,
          amount: newAmount,
          channelId: fromChannelId,
          ttl: 5
        })
      })

      // Save fromChannel details
      route.fromChannels[fromChannelId] = {
        channelId: fromChannelId,
        receiveAmount: newAmount
      }
    }
  }

  // Save in routing table
  self.routingTable[hash] = route
}

// Steps when forwarding a routing message:
// 1. Check if we are the source in pendingRoutes.
//    - If we are, output.
//    - If not, forward.
// 2. Check if there already is a routingTable entry with a lower amount
// 3. Determine prices for neighbors
// 4. Send to neighbors with enough money
// 5. Record details in routingTable
//   - hash
//    - toChannel
//    - sendAmount
//    - fromChannels
//      - channelId
//      - receiveAmount
function forwardRoutingMessage (self, { hash, amount, channelId, ttl }) {
  let routingMessage = { hash, amount, channelId, denom: self.channels[channelId].denomination }
  // Is source
  if (self.pendingRoutes[hash]) {
    console.log('#############', self.ipAddress, 'received routing message', routingMessage)
  // Is destination
  } else if (self.pendingPayments[hash]) {
    console.log(self.ipAddress, 'is destination', routingMessage)
  } else if (self.routingTable[hash] && self.routingTable[hash].sendAmount <= amount) {
    console.log(self.ipAddress, 'old entry is lower or equal', routingMessage)
  // } else if (ttl < 1) {
  //   console.log(self.ipAddress, 'ttl expired', routingMessage)
  } else {
    numberProcessed++
    console.log(self.ipAddress, 'routing message is ok', routingMessage, 'number processed', numberProcessed)
    let toChannel = self.channels[channelId]

    // Create routingTable entry
    // Remember that the payment goes *to* the neighbor that the routing message is *from*
    let route = {
      hash,
      toChannel: channelId,
      sendAmount: amount,
      fromChannels: {},
    }

    // Iterate through channels
    for (let fromChannelId in self.channels) {
      let fromChannel = self.channels[fromChannelId]

      // Convert to fromChannel's denomination
      let newAmount = exchange(self, { amount, from: toChannel.denomination, to: fromChannel.denomination })
        // Convert fee and add that as well
        + exchange(self, { amount: self.fee.amount, from: self.fee.denomination, to: fromChannel.denomination})

      // If they have enough in their side of the channel
      if (fromChannel.theirBalance > newAmount) {
        let newRoutingMessage = {
          hash,
          amount: newAmount,
          denomination: fromChannel.denomination,
          channelId: fromChannelId,
          ttl: ttl - 1
        }
        numberOfForwards++
        console.log(self.ipAddress, 'forwarding routing message', newRoutingMessage, 'to', fromChannel.ipAddress, '# forwards', numberOfForwards)
        transmit(() => {
          forwardRoutingMessage(network.nodes[fromChannel.ipAddress], newRoutingMessage)
        })

        // Save fromChannel details
        route.fromChannels[fromChannelId] = {
          channelId: fromChannelId,
          receiveAmount: newAmount
        }
      }
    }

    // Save in routing table
    self.routingTable[hash] = route
  }
}

// Steps when sending a payment:
// 1. Look up in routing table
// 2. Send correct amount to the channel
function sendPayment (self, { hash, channelId }) {
  console.log('sendPayment')
  let route = self.routingTable[hash]
  let fromChannel = route.fromChannels[channelId]

  transmit(() => {
    forwardPayment(network.nodes[fromChannel.ipAddress], {
      hash,
      amount: route.sendAmount,
      channelId: route.toChannel
    })
  })
}

// Steps when receiving a payment
// 1. Check if amount is correct in routing table
// 2. Check if we are the destination by checking pendingPayments
//    - If we are, delete from pendingPayments and output.
//    - If not, forward.
function forwardPayment (self, { hash, amount, channelId }) {
  console.log('forwardPayment', { hash, amount, channelId })
  let route = self.routingTable[hash]
  let fromChannel = route.fromChannels[channelId]

  if (fromChannel.amount === amount) {
    // Are we the destination?
    if (self.pendingPayments[hash]) {
      console.log('received payment')
    } else {
      transmit(() => {
        forwardPayment(network.nodes[fromChannel.ipAddress], {
          hash,
          amount: route.sendAmount,
          channelId: route.toChannel
        })
      })
    }
  }
}

function makeMarkedCard (cardLength, cardDepth, cardTable) {
  return new Array(cardLength).map((item) => {
    return Math.floor(Math.random() * cardDepth)
  })
}

function checkMarkedCard (card, paymentHash, cardTable) {
  let { position, value } = cardTable[paymentHash]
  return card[position] === value
}

function markMarkedCard (card, paymentHash, cardTable) {
  let position = Math.floor(Math.random() * card.length)
  let value = Math.floor(Math.random() * cardDepth)
  cardTable[paymentHash] = {
    position,
    value
  }
  card[position] = value
  return card
}

// let network = smallRandomGraph
let network = basicGraph

function startSimulation (network) {

  channelChecker(basicGraph.nodes)

  initNodes(network)

  initializePayment(network.nodes[4], network.nodes[3], { amount: 1, denomination: 'USD'})
}

