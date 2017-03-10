import * as d3 from 'd3'

export const turnoutColorScale = d3.scaleSequential(d3.interpolateMagma)
export const clusterColorScale = d3.scaleOrdinal(d3.schemeCategory20c)
let domainsInitialized = false

export const updateScales = (state) => {
  if (!domainsInitialized) {
    turnoutColorScale.domain(d3.extent(state.data, (d) => d['turnout']))
    domainsInitialized = true
  }
}

export const canvasFactory = (selector, sizeObj, marginObj) => d3.select(selector)
  .classed('svg-container', true)
  .append('svg')
  .attr('preserveAspectRatio', 'xMidYMid meet')
  .attr('viewBox', `0 0 ${marginObj.left + sizeObj.width + marginObj.right} ${marginObj.top + sizeObj.height + marginObj.bottom}`)
  .classed('svg-content-responsive', true)
  .append('g')
  .attr('transform', `translate(${marginObj.left}, ${marginObj.top})`)

