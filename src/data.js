import * as d3 from 'd3'
import {DBSCAN} from 'density-clustering'

import {correlation} from './calc'

const loadMunicipalities = () => new Promise((resolve, reject) => {
  d3.json('data/municipalities-wgs84.geojson', (data) => resolve(data))
})

const loadTemperatures = () => new Promise((resolve, reject) => {
  d3.csv('data/temperature.csv', (data) => resolve(data))
})

const loadPrecipitation = () => new Promise((resolve, reject) => {
  d3.csv('data/precipitation.csv', (data) => resolve(data))
})

const loadElections = () => new Promise((resolve, reject) => {
  d3.csv('data/elections.csv', (data) => resolve(data))
})

export const loadData = () => new Promise((resolve, reject) => {
  Promise.all([
    loadElections(),
    loadMunicipalities(),
    loadPrecipitation(),
    loadTemperatures()
  ]).then((result) => {
    const data = result[0]
      .filter((d) => d.region !== '1229 Bara')
      .filter((d) => d['Valdeltagande i riksdagsval'] !== '..')
      .map((d) => {
        const year = d['val�r']
        const municipality = d.region.slice(0, 4)
        const turnout = Number(d['Valdeltagande i riksdagsval'])
        const precipitation = Number(
          result[2]
            .find((t) => (t.year === year && t.municipality === municipality))
            .value
        )
        const temperature = Number(
          result[3]
            .find((t) => (t.year === year && t.municipality === municipality))
            .value
        )

        return {
          year,
          municipality,
          turnout,
          temperature,
          precipitation
        }
      })

    const geoData = Object.assign({}, result[1], {
      features: result[1].features.map((f) => Object.assign(f, {
        properties: {
          id: f.properties.KnKod,
          name: f.properties.KnNamn
        }
      }))
    })

    resolve({
      data,
      geoData,
      selection: new Array(data.length).fill(true)
    })
  })
})

export const deriveData = (previousState, newPartialState) => {
  // Only derive data if the selection has been modified
  if (newPartialState.selection !== undefined) {
    // On first load, previousState is null
    const state = previousState ? previousState : newPartialState
    const selectedData = state.data.filter((_, i) => newPartialState.selection[i])

    /*const dbscan = new DBSCAN()
    let clusters = new Array(state.data.length).fill(null)
    dbscan
      .run(state.data.map((d, i) => [d.turnout, d.temperature, d.precipitation]), 0.8, 2)
      .forEach((members, id) => {
        members.forEach((member) => {clusters[member] = id})
      })
    console.log(clusters)*/

    const derivedMunicipalityData = state.geoData.features
      .map((municipality) => {
        const munData = selectedData
          .filter((d) => d.municipality === municipality.properties.id)

        return ({
          municipality: municipality.properties.id,
          samples: munData.length,
          meanTurnout: d3.mean(munData.map((d) => d.turnout)),
          correlationPrecipitationTurnout: correlation(
            munData.map((d) => d.precipitation),
            munData.map((d) => d.turnout)
          ),
          correlationTemperatureTurnout: correlation(
            munData.map((d) => d.temperature),
            munData.map((d) => d.turnout)
          )
        })
      })

    newPartialState.derivedData = {
      perMunicipality: derivedMunicipalityData
    }
  }


  return newPartialState
}