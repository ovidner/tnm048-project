let state = null
let stateModifiers = []
let stateSubscribers = []

export const addStateSubscriber = (stateSubscriber) => {
  stateSubscribers.push(stateSubscriber)
}

export const addStateModifier = (stateModifier) => {
  stateModifiers.push(stateModifier)
}

export const getState = () => state

export const setState = (partialState) => {
  // Sends partialState to all state modifiers, letting them do further mods of
  // partialState
  const newState = Object.assign({}, state, stateModifiers.reduce(
    (newPartialState, modifier) => modifier(state, newPartialState), partialState
  ))

  stateSubscribers.forEach((sub) => {sub(newState)})
  state = newState
}
