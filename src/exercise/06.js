// Control Props
// http://localhost:3000/isolated/exercise/06.js

import * as React from 'react'
import {Switch} from '../switch'
import warning from 'warning'

const callAll =
  (...fns) =>
  (...args) =>
    fns.forEach(fn => fn?.(...args))

const actionTypes = {
  toggle: 'toggle',
  reset: 'reset',
}

function toggleReducer(state, {type, initialState}) {
  switch (type) {
    case actionTypes.toggle: {
      return {on: !state.on}
    }
    case actionTypes.reset: {
      return initialState
    }
    default: {
      throw new Error(`Unsupported type: ${type}`)
    }
  }
}

const useControlledChangesWarning = ({
  controlPropValue,
  controlPropName,
  defaultPropName,
  componentName,
  readOnly,
  onChange,
}) => {
  const isControlled = controlPropValue !== null
  const {current: wasControlled} = React.useRef(isControlled)

  React.useEffect(() => {
    const doNotWarnAboutMissingOnChangeHandler =
      readOnly ||
      !isControlled ||
      (isControlled && typeof onChange === 'function')

    const doNotWarnAboutChangeFromUncontrolledToControlledComponent = !(
      isControlled && !wasControlled
    )

    const doNotWarnAboutChangeFromControlledToUncontrolledComponent = !(
      !isControlled && wasControlled
    )

    warning(
      doNotWarnAboutMissingOnChangeHandler,
      `Failed prop type: You provided a \`${controlPropName}\` prop to ${componentName} without an \`onChange\` handler. This will render a read-only ${componentName}. If the ${componentName} should be mutable use \`${defaultPropName}\`. Otherwise, set either \`onChange\` or \`readOnly\`.`,
    )

    warning(
      doNotWarnAboutChangeFromUncontrolledToControlledComponent,
      `A component is changing an uncontrolled prop \`${controlPropName}\` on ${componentName} to be controlled. ${componentName} should not switch from uncontrolled to controlled (or vice versa). Decide between using a controlled or uncontrolled prop ${controlPropName} for the lifetime of the component. More info: https://fb.me/react-controlled-components`,
    )

    warning(
      doNotWarnAboutChangeFromControlledToUncontrolledComponent,
      `A component is changing a controlled prop \`${controlPropName}\` on ${componentName} to be uncontrolled. ${componentName} should not switch from controlled to uncontrolled (or vice versa). Decide between using an uncontrolled or controlled prop ${controlPropName} for the lifetime of the component. More info: https://fb.me/react-controlled-components`,
    )
  }, [
    isControlled,
    wasControlled,
    controlPropName,
    defaultPropName,
    componentName,
    onChange,
    readOnly,
  ])
}

function useToggle({
  initialOn = false,
  reducer = toggleReducer,
  onChange,
  on: controlledOn = null,
  readOnly = false,
} = {}) {
  const {current: initialState} = React.useRef({on: initialOn})
  const [state, dispatch] = React.useReducer(reducer, initialState)

  const onIsControlled = controlledOn !== null

  const on = onIsControlled ? controlledOn : state.on

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useControlledChangesWarning({
      controlPropValue: controlledOn,
      controlPropName: 'on',
      defaultPropName: 'initialOn',
      componentName: 'useToggle',
      readOnly,
      onChange,
    })
  }

  const dispatchWithOnChange = action => {
    if (!onIsControlled) {
      dispatch(action)
    }

    if (onChange) {
      onChange(reducer({...state, on}, action), action)
    }
  }

  const toggle = () => dispatchWithOnChange({type: actionTypes.toggle})
  const reset = () =>
    dispatchWithOnChange({type: actionTypes.reset, initialState})

  function getTogglerProps({onClick, ...props} = {}) {
    return {
      'aria-pressed': on,
      onClick: callAll(onClick, toggle),
      ...props,
    }
  }

  function getResetterProps({onClick, ...props} = {}) {
    return {
      onClick: callAll(onClick, reset),
      ...props,
    }
  }

  return {
    on,
    reset,
    toggle,
    getTogglerProps,
    getResetterProps,
  }
}

function Toggle({on: controlledOn, onChange, initialOn, reducer, readOnly}) {
  const {on, getTogglerProps} = useToggle({
    on: controlledOn,
    onChange,
    initialOn,
    reducer,
    readOnly,
  })
  const props = getTogglerProps({on})
  return <Switch {...props} />
}

function App() {
  const [bothOn, setBothOn] = React.useState(false)
  const [timesClicked, setTimesClicked] = React.useState(0)

  function handleToggleChange(state, action) {
    if (action.type === actionTypes.toggle && timesClicked > 4) {
      return
    }
    setBothOn(state.on)
    setTimesClicked(c => c + 1)
  }

  function handleResetClick() {
    setBothOn(false)
    setTimesClicked(0)
  }

  return (
    <div>
      <div>
        <Toggle on={bothOn} onChange={handleToggleChange} />
        <Toggle on={bothOn} onChange={handleToggleChange} />
      </div>
      {timesClicked > 4 ? (
        <div data-testid="notice">
          Whoa, you clicked too much!
          <br />
        </div>
      ) : (
        <div data-testid="click-count">Click count: {timesClicked}</div>
      )}
      <button onClick={handleResetClick}>Reset</button>
      <hr />
      <div>
        <div>Uncontrolled Toggle:</div>
        <Toggle
          onChange={(...args) =>
            console.info('Uncontrolled Toggle onChange', ...args)
          }
        />
      </div>
    </div>
  )
}

export default App
// we're adding the Toggle export for tests
export {Toggle}

/*
eslint
  no-unused-vars: "off",
*/
