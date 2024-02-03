import { Accessor, Component, Match, Switch, createSignal } from 'solid-js'

import Root from './cell/view/Root'
import RootCell from './cell/view/RootCell'

type Route =
  | {
      id: 'root'
    }
  | {
      id: 'cell'
      cell_id: Accessor<string>
    }

const Router: Component = () => {
  const [route, setRoute] = createSignal<Route>({
    id: 'root',
  })

  return (
    <Switch>
      <Match when={route().id === 'root'}>
        <Root
          onSelectCell={(cell_id: string) => {
            setRoute({ id: 'cell', cell_id: () => cell_id })
          }}
        />
      </Match>
      <Match when={route().id === 'cell'}>
        <RootCell
          cell_id={(route() as Extract<Route, { id: 'cell' }>).cell_id}
          onClose={() => {
            setRoute({ id: 'root' })
          }}
        />
      </Match>
    </Switch>
  )
}

export default Router
