import * as d3 from 'd3'
import debounce from 'javascript-debounce'

import { canvasFactory, clusterColorScale, turnoutColorScale } from '../shared'
import {getState, setState} from '../state'

const size = {
  width: 505,
  height: 800
}

const margin = {
  top: 30,
  bottom: 20,
  left: 20,
  right: 20
}

const canvas = canvasFactory('#parcoord', size, margin)

const dimensions = [
  {
    id: 'year',
    name: 'Year',
    unit: '',
    type: 'disc',
    scale: d3.scalePoint()
      .range([0, size.width])
  },
  {
    id: 'temperature',
    name: 'Temperature',
    type: 'cont',
    unit: '°C',
    scale: d3.scaleLinear()
      .range([0, size.width])
  },
  {
    id: 'turnout',
    name: 'Voter turnout',
    unit: '%',
    type: 'cont',
    scale: d3.scaleLinear()
      .range([0, size.width])
  },
  {
    id: 'precipitation',
    name: 'Precipitation',
    unit: 'mm',
    type: 'cont',
    scale: d3.scaleLinear()
      .range([0, size.width])
  }
].map((dim) => Object.assign(dim, {filterExtent: null}))

let domainsInitialized = false

const xAxis = d3.axisTop()

const yScale = d3.scalePoint()
  .range([0, size.height])
  .domain(dimensions.map((d) => (d.id)))

const line = d3.line()//.curve(d3.curveMonotoneY)
const path = (d) => line(dimensions.map((dim) => (
  [dim.scale(d[dim.id]), yScale(dim.id)]
)))

const brush = debounce((dimensionIndex, event) => {
  const invertPointScale = (selection, scale) => scale.domain().filter((d) => (
  selection[0] <= scale(d) && scale(d) <= selection[1]))
  const invertContScale = (selection, scale) => selection.map((s) => scale.invert(s))
  const scale = dimensions[dimensionIndex].scale
  const invert = dimensions[dimensionIndex].type === 'cont' ? invertContScale : invertPointScale
  dimensions[dimensionIndex].filterExtent = event.selection ? invert(event.selection, scale) : null

  const currentState = getState()
  setState({
    selection: currentState.data.map((d, i) => dimensions.every((dim) => {
      if (dim.filterExtent === null) {
        return true
      } else if (dim.type === 'cont') {
        return dim.filterExtent[0] <= d[dim.id] && d[dim.id] <= dim.filterExtent[1]
      } else {
        return dim.filterExtent.includes((fe) => d[dim.id])
      }
    }))
  })
}, 250)

const paths = canvas
  .append('g')
  .selectAll('path')

export const draw = (state) => {
  if (!domainsInitialized) {
    dimensions.forEach((dim) => {
      dim.scale.domain(dim.type === 'cont'
        ? d3.extent(state.data, (d) => (d[dim.id]))
        : state.data.map((d) => (d[dim.id])).sort()
      )

      if (dim.scale.nice) dim.scale.nice()
    })
    domainsInitialized = true
  }

  paths.data(state.data).exit()
    .remove()

  paths.data(state.data).enter()
    .append('path')
    .attr('d', path)
    .style('fill', 'none')
    .style('stroke', (d, i) => turnoutColorScale(d.turnout))
    .style('stroke-width', '1px')
    .style('opacity', 0.2)

  const xAxes = canvas
    .selectAll('.dimension')
    .data(dimensions)
    .enter()
    .append('g')
    .attr('class', 'dimension')
    .attr('transform', (d) => `translate(0,${yScale(d.id)})`)
    .append('g')
    .attr('class', 'axis')
    .each((d, i, nodes) => d3.select(nodes[i]).call(xAxis.scale(d.scale)))
  xAxes
    .append('text')
    .attr('class', 'title')
    .attr('text-anchor', 'start')
    .attr('y', 15)
    .text((d) => (d.name))
  xAxes
    .append('text')
    .attr('class', 'unit')
    .attr('text-anchor', 'end')
    .attr('x', size.width)
    .attr('y', 15)
    .text((d) => (d.unit))
  xAxes
    .append('g')
    .classed('brush', true)
    .each((d, i, nodes) => {
      d3.select(nodes[i]).call(
        d3.brushX()
          .extent([[0, -7], [size.width, 7]])
          .on('brush', () => brush(i, d3.event))
          .on('end', () => brush(i, d3.event))
      )

    })
}