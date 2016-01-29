// let React = require('react')
let d3 = require('d3')
let log = ''

function replacer (key, value) {
  if (value === Infinity) {
    return 'Infinity';
  }

  if (key === 'neighbors') {
    return undefined
  }

  return value;
}

exports.drawNetwork = function (network) {
  drawGraph(network2graph(network))
}

exports.updateNetwork = function (network) {
  // let container = document.getElementById('container')
  // container.textContent = JSON.stringify(network.nodes, replacer, 2)
}

function network2graph (network) {
  let graph = { nodes: [], links: [] }
  let linkMap = {}

  for (let ipAddress in network.nodes) {
    let node = network.nodes[ipAddress]

    graph.nodes[ipAddress] = { name: ipAddress }
    for (let channelId in node.channels) {
      let channel = node.channels[channelId]

      linkMap[channelId] = {
        name: channelId,
        source: Number(ipAddress),
        target: channel.ipAddress
      }
    }
  }

  for (let ipAddress in linkMap) {
    let link = linkMap[ipAddress]
    graph.links.push(link)
  }

  // for (let edgeId in network.edges) {
  //   let [nodeIdA, nodeIdB] = edgeId.split('->')
  //   let cost = network.edges[edgeId].cost

  //   graph.links.push({
  //     source: graph.nodes.findIndex(element => element.name === nodeIdA),
  //     target: graph.nodes.findIndex(element => element.name === nodeIdB),
  //     cost
  //   })
  // }

  return graph
}



function drawGraph (graph) {
  let width = 250
  let height = 250
console.log(graph)
  let color = d3.scale.category20()

  let force = d3.layout.force()
      .charge(-120)
      .linkDistance(50)
      .size([width, height])

  let svg = d3.select('#d3').append('svg')
      .attr('width', width)
      .attr('height', height)

      force
          .nodes(graph.nodes)
          .links(graph.links)
          .start()

      // d3.timer(force.resume)

      var linkGroup = svg.selectAll('.link')
          .data(graph.links)
        .enter().append('g')
          .attr('class', 'linkGroup')

      var link = linkGroup.append('line')
          .attr('class', 'link')
          .style('stroke', '#ccc')

      // var linkText = linkGroup.append('svg:text')
      //   .attr('class', 'zEnd')
      //   .attr('text-anchor', 'end')
      //   .text(function(d) { return d.cost })

      var node = svg.selectAll('.node')
          .data(graph.nodes)
        .enter().append('g')
          .attr('class', 'node')
          .call(force.drag)

      node.append('circle')
          .attr('class', 'node')
          .attr('r', 5)
          .style('fill', function(d) { return color(d.group) })

      node.append('text')
          .attr('dx', 12)
          .attr('dy', '.35em')
          .text(function(d) { return d.name })

  force.on('tick', function() {
    link.attr('x1', function(d) { return d.source.x })
        .attr('y1', function(d) { return d.source.y })
        .attr('x2', function(d) { return d.target.x })
        .attr('y2', function(d) { return d.target.y })

    // linkText
    //     .attr('x', function(d) { return (d.target.x + d.source.x) / 2 })
    //     .attr('y', function(d) { return (d.target.y + d.source.y) / 2 })

    node.attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')' })
  })

  svg.append('defs').selectAll('marker')
      .data(['suit'])
    .enter().append('marker')
      .attr('id', function(d) { return d; })
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 16)
      .attr('refY', 0)
      .attr('markerWidth', 4)
      .attr('markerHeight', 4)
      .attr('orient', 'auto')
    .append('path')
      .attr('d', 'M0,-5L10,0L0,5 L10,0 L0, -5')
      .style('stroke', '#4679BD')
      .style('opacity', '0.6');
}

//   A--B
// 1/  1 \1
// S      D
// 1\  5 /
//   C--/

// let network = {
//   S: { neighbors: ['A', 'C'], cost: 1 },
//   A: { neighbors: ['S', 'B'], cost: 1 },
//   B: { neighbors: ['A', 'D'], cost: 1 },
//   C: { neighbors: ['S', 'D'], cost: 500 },
//   D: { neighbors: ['B', 'C'], cost: 1 }
// }

// console.log(network2graph(network))

// drawGraph(network2graph(newtwork))
//
// let graph = {
//   nodes: [
//     { name: 'S' },
//     { name: 'A' },
//     { name: 'B' },
//     { name: 'C' },
//     { name: 'D' }
//   ],
//   links: [
//     { source: 0, target: 1 },
//     { source: 1, target: 0 },
//     { source: 0, target: 3 },
//     { source: 0, target: 1 },
//     { source: 0, target: 1 },
//     { source: 0, target: 1 },
//     { source: 0, target: 1 },
//     { source: 0, target: 1 }
//   ]
