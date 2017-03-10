import densityClustering from 'density-clustering'

import {dbscanCluster, euclideanDistance} from './calc'
import {loadData, deriveData} from './data'
import * as map from './representations/map'
import * as parCoord from './representations/parcoord'
import * as scatter from './representations/scatter'
import {updateScales} from './shared'
import {addStateModifier, addStateSubscriber, setState} from './state'

import 'bootstrap/dist/css/bootstrap.css'
import './index.css'

addStateSubscriber(updateScales)
addStateSubscriber(map.draw)
addStateSubscriber(parCoord.draw)
addStateSubscriber(scatter.draw)

addStateModifier(deriveData)

loadData().then((data) => {
  setState(data)
})
