import * as d3 from 'd3'
import { canvasFactory, turnoutColorScale } from '../shared'

const size = {
  width: 350,
  height: 800
}

const margin = {
  top: 20,
  bottom: 20,
  left: 20,
  right: 20
}

const canvas = canvasFactory('#map', size, margin)

const projection = d3.geoMercator()
let projectionInitialized = false
const path = d3.geoPath().projection(projection)

export const draw = (state) => {
  if (!projectionInitialized) {
    projection.fitSize([size.width, size.height], state.geoData)
    projectionInitialized = true
  }

  const paths = canvas
    .append('g')
    .selectAll('.country')
    .data(state.geoData.features)

  paths.enter().append('path')
    .attr('d', path)
    .attr('id', (d) => (d.id))
    .style('stroke-width', '0.2px')
    .style('stroke', 'white')
    .style('fill', (d) => turnoutColorScale(
      state.derivedData.perMunicipality
        .find((row) => row.municipality === d.properties.id).meanTurnout)
    )
}