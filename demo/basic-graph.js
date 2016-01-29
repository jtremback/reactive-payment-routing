
//             $/€:1/1
// (5) $10-E-$10 (1) $20-A-$10 (3) $30-D-$10 (4)
//                €5         $40
//                 \         /
//                  B       C
//                   \     /
//                   €10 $30
//                     (2)
//                   €/$:2/1

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