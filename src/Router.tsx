import { Accessor, Component, Match, Switch, createSignal } from 'solid-js'

import RootMatrix from './matrix/view/RootMatrix'
import Matrix from './matrix/view/Matrix'
import ImpulsePage from './impulse/view/ImpulsePage'

type Route =
  | {
      id: 'root-matrix'
    }
  | {
      id: 'matrix'
      matrix_id: Accessor<string>
    }
  | {
      id: 'impulse'
    }

const Router: Component = () => {
  const [route, setRoute] = createSignal<Route>({
    id: 'root-matrix',
  })

  return (
    <Switch>
      <Match when={route().id === 'root-matrix'}>
        <>
          <RootMatrix
            onSelectMatrix={(matrix_id: string) => {
              setRoute({ id: 'matrix', matrix_id: () => matrix_id })
            }}
          />
          <button
            onClick={() => {
              setRoute({ id: 'impulse' })
            }}
          >
            Impulse
          </button>
        </>
      </Match>
      <Match when={route().id === 'matrix'}>
        <Matrix
          matrix_id={(route() as Extract<Route, { id: 'matrix' }>).matrix_id}
          onClose={() => {
            setRoute({ id: 'root-matrix' })
          }}
        />
      </Match>
      <Match when={route().id === 'impulse'}>
        <ImpulsePage />
      </Match>
    </Switch>
  )
}

export default Router
