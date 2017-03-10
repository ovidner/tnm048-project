import * as d3 from 'd3'

export const correlation = (x, y) => {
  const xMean = d3.mean(x)
  const yMean = d3.mean(y)

  const xDevs = x.map((v) => v - xMean)
  const yDevs = y.map((v) => v - yMean)
  const xxDevSum = d3.sum(xDevs.map((v) => Math.pow(v, 2)))
  const yyDevSum = d3.sum(yDevs.map((v) => Math.pow(v, 2)))
  const xyDevSum = d3.sum(xDevs.map((v, i) => v * yDevs[i]))

  return (xyDevSum / (Math.sqrt(xxDevSum) * Math.sqrt(yyDevSum)))
}

export const euclideanDistance = (A, B) => Math.hypot.apply(null, A.map((a, i) => a - B[i]))

export const dbscanCluster = (data, epsilon=1, minPoints=3, distanceFunc=euclideanDistance) => {
  let assigned = new Array(data.length).fill(false)
  let clusters = []
  let noise = []
  let visited = new Array(data.length).fill(false)

  const addToCluster = (pointId, clusterId) => {
    clusters[clusterId].push(pointId)
    assigned[pointId] = true
  }
  const getNeighborIds = (pointId) => data
    .filter((neighborPoint) => distanceFunc(data[pointId], neighborPoint) < epsilon)
    .map((_, i) => i)
  const mergeArrays = (A, B) => A.concat(B.filter((p) => !A.includes(p)))

  const expandCluster = (clusterId, neighborIds) => {
    // map/forEach won't do here since we mutate neighborIds
    for (let i = 0; i < neighborIds.length; i += 1) {
      let pointId = neighborIds[i]

      if (!visited[pointId]) {
        visited[pointId] = true

        let pointNeighborIds = getNeighborIds(pointId)
        if (pointNeighborIds.length >= minPoints) {
          console.log(neighborIds, pointNeighborIds)
          neighborIds = mergeArrays(neighborIds, pointNeighborIds)
        }
      }

      if (!assigned[pointId]) {
        addToCluster(pointId, clusterId)
      }
    }
  }

  data.forEach((_, pointId) => {
    if (!visited[pointId]) {
      visited[pointId] = true

      let neighborIds = getNeighborIds(pointId)
      if (neighborIds.length < minPoints) {
        noise.push(pointId)
      } else {
        let clusterId = clusters.length
        clusters.push([])
        addToCluster(pointId, clusterId)
        expandCluster(clusterId, neighborIds)
      }
    }
  })

  return [clusters, noise]
}
