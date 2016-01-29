const randomGraph = require('randomgraph')
const sha3 = require('js-sha3')

const tm = 10
const cardLength = 100
const cardDepth = 100
const ttl = 2
const numberOfNodes = 100
const numberOfEdges = 300

let numberOfForwards = 0

// let network = graph2network(randomGraph.BarabasiAlbert(numberOfNodes, 5, 5))
let network = graph2network(randomGraph.ErdosRenyi.nm(numberOfNodes, numberOfEdges))

let source = Math.floor(boundedRandom(1, numberOfNodes))
let destination = Math.floor(boundedRandom(1, numberOfNodes))
console.log('numberOfNodes: ' + numberOfNodes + ', numberOfEdges: ' + numberOfEdges + ', source: ' + source + ', destination: ' + destination)
startSimulation(network, {
  from: source,
  to: destination,
  amount: 1,
  denomination: 'USD'
})

// This function turns the randomly generated graph into a network for our simulation
function graph2network (graph) {
  let nodes = graph.nodes.reduce((acc, item, index) => {
    let node = {
      ipAddress: index,
      exchangeRates: {
        'USD/EUR': boundedRandom(0.9, 1.3) + '/' + boundedRandom(1.9, 2.3),
        'EUR/USD': boundedRandom(1.9, 2.3) + '/' + boundedRandom(0.9, 1.3)
      },
      fee: {
        amount: boundedRandom(0, .2),
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
    let sourceBalance = boundedRandom(1, 10)
    let targetBalance = boundedRandom(1, 10)
    nodes[edge.source].channels[edge.target] = {
      channelId,
      ipAddress: edge.target,
      denomination: denomination,
      myBalance: sourceBalance,
      theirBalance: targetBalance
    }

    nodes[edge.target].channels[edge.source] = {
      channelId,
      ipAddress: edge.source,
      denomination: denomination,
      myBalance: targetBalance,
      theirBalance: sourceBalance
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
    node.cardTable = {}
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
  log(['node', self.ipAddress + ':', 'receive route initialization', amount, denomination])
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
      log(['node', self.ipAddress + ':', 'sending routing message', 'to', fromChannel.ipAddress, amount, denomination, 'ttl: ' + ttl])
      transmit(() => {
        forwardRoutingMessage(network.nodes[fromChannel.ipAddress], {
          hash,
          amount: newAmount,
          channelId: fromChannelId,
          markedCard: makeMarkedCard(cardLength, cardDepth),
          ttl
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
function forwardRoutingMessage (self, { markedCard, hash, amount, channelId, ttl }) {

  let denomination = self.channels[channelId].denomination
  // Is source
  if (self.pendingRoutes[hash]) {
    log(['node', self.ipAddress + ':', 'received routing message', amount, denomination, 'ttl: ' + ttl], 'source')
  // Is destination
  } else if (self.pendingPayments[hash]) {
    log(['node', self.ipAddress + ':', 'is destination', amount, denomination])
  } else if (self.routingTable[hash] && self.routingTable[hash].sendAmount <= amount) {
    log(['node', self.ipAddress + ':', 'old entry is lower or equal', amount, denomination])
  } else if (ttl < 1) {
    log([self.ipAddress, 'ttl expired', amount, denomination])
  } else if (checkMarkedCard(markedCard, hash, self.cardTable)) {
    log([self.ipAddress, '+++++++++++++++++++++++++++marked card seen already', amount, denomination])
  } else {
    log(['node', self.ipAddress + ':', 'routing message is ok', amount, denomination])
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
          ttl: ttl - 1,
          markedCard: markMarkedCard(markedCard, hash, self.cardTable),
        }
        numberOfForwards++
        log(['node', self.ipAddress + ':', 'forwarding routing message', 'to', fromChannel.ipAddress, amount, denomination, 'ttl: ' + ttl])
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
  log(['sendPayment'])
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
  log(['forwardPayment', { hash, amount, channelId }])
  let route = self.routingTable[hash]
  let fromChannel = route.fromChannels[channelId]

  if (fromChannel.amount === amount) {
    // Are we the destination?
    if (self.pendingPayments[hash]) {
      log(['received payment'])
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

function makeMarkedCard (cardLength, cardDepth) {
  return new Array(cardLength).map(() => {
    return Math.floor(Math.random() * cardDepth)
  })
}

function checkMarkedCard (card, paymentHash, cardTable) {
  if (cardTable[paymentHash]) {
    let { position, value } = cardTable[paymentHash]
    return card[position] === value
  }
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

function boundedRandom (min, max) {
  let diff = max - min
  return min + (Math.random() * diff)
}

let logVars = { main: 'Activity log: \n', source: 'Routing messages received by source: \n'}
let timeout = setTimeout(dumpLog, 1000)
let start = Date.now()
function log (args, dest) {
  logVars[dest || 'main'] += (Date.now() - start) / 1000 + 's' + ' ' + args.join(' ') + '\n'
  clearTimeout(timeout)
  timeout = setTimeout(dumpLog, 1000)
}


function dumpLog () {
  console.log('Number of forwards: ' + numberOfForwards)
  console.log(logVars['main'])
  console.log(logVars['source'])
}

function startSimulation (network, {from, to, amount, denomination}) {

  channelChecker(network.nodes)

  initNodes(network)

  initializePayment(network.nodes[from], network.nodes[to], { amount, denomination})
}
