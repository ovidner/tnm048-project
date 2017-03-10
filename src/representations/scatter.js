import * as d3 from 'd3'
import { canvasFactory, turnoutColorScale } from '../shared'

const size = {
  width: 515,
  height: 515
}

const margin = {
  top: 20,
  bottom: 20,
  left: 20,
  right: 20
}

const canvas = canvasFactory('#scatter', size, margin)

const xScale = d3.scaleLinear().range([0, size.width]).domain([-1, 1])
const yScale = d3.scaleLinear().range([size.height, 0]).domain([-1, 1])
const rScale = d3.scaleLinear().range([1, 12]).domain([66,100])

const xAxis = d3.axisBottom(xScale)
const yAxis = d3.axisLeft(yScale)

export const draw = (state) => {
  const points = canvas.selectAll('.point')
    .data(state.derivedData.perMunicipality)
    .enter().append('circle')
    .classed('point', true)
    .attr('cx', (d) => xScale(d.correlationPrecipitationTurnout))
    .attr('cy', (d) => yScale(d.correlationTemperatureTurnout))
    .attr('r', 5)
    .style('fill', (d) => turnoutColorScale(d.meanTurnout))
    .style('opacity', 0.75)

  canvas
    .append('g')
    .attr('transform', `translate(0,${yScale(0)})`)
    .call(xAxis)
    .classed('axis', true)
    .append('text')
    .classed('title', true)
    .attr('text-anchor', 'start')
    .attr('y', -8)
    .text('Precipitation-turnout correlation')

  canvas
    .append('g')
    .attr('transform', `translate(${xScale(0)},0)`)
    .call(yAxis)
    .classed('axis', true)
    .append('text')
    .classed('title', true)
    .attr('text-anchor', 'start')
    .attr('transform', `rotate(-90)`)
    .attr('x', -size.height)
    .attr('y', 16)
    .text('Temperature-turnout correlation')

}
