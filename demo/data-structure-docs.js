
node: {
         fromChannel
      $receiveAmount
           \
     fromChannel-$receiveAmount-(node)-$sendAmount--> toChannel
           /
      $receiveAmount
         fromChannel
  // toChannel has a one-to-many relationship with fromChannels
  // Another routing message that is received with the same hash and a lower
  // sendAmount will override this one.
  routingTable: {
    [hash]: {
      hash,
      toChannel,
      sendAmount, // This is how much the next step must recieve to
                  // convey the payment further. Non-negotiable.
      fromChannels: {
        [channelId]: {
          receiveAmount // We determine this
        }
      },
    }
  },

  exchangeRates: {
    ['asset' + '/' + 'asset']: 'numerator' + '/' + 'denominator',
  },

  fee: {
    amount,
    denomination
  }

  // Source has these
  // These are created by initializeRoute and checked by forwardRoutingMessage
  pendingRoutes: {
    [hash]: {
      secret,
    }
  },

  // Destination has these
  // These are created by sendRoutingMessage and checked by receivePayment
  pendingPayments: {
    [hash]: {
      secret,
    }
  },

  channels: {
    [channelId]: {
      channelId,
      ipAddress,
      denomination,
      myBalance,
      theirBalance
    }
  }

}

routingMessage: {
  hash: xyz123,
  amount: 100,
  channelId: A
}

hashlockedPayment: {
  hash: xyz123,
  amount: 100,
  channelId: A
}