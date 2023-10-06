import { Accessor, Component, Show, createSignal } from 'solid-js'
import Modal from '@lutaok/solid-modal'
import Table from 'solid-surfaces/components/Table'
import { Transition } from 'solid-transition-group'

import Button from 'solid-surfaces/components/Button'
import Lined from 'solid-surfaces/components/stellation/Lined'
import { Dimmed } from 'solid-surfaces/components/typo/Color'
import { Header } from 'solid-surfaces/components/typo/Header'

import { getMatrixHarmonics, getMatrix, deleteMatrix } from '../harmonizer'

import styles from './Matrix.module.sass'

type MatrixProps = {
  matrix_id: Accessor<string>
  onClose: () => void
}

const Matrix: Component<MatrixProps> = (props) => {
  const [isModalOpen, setIsModalOpen] = createSignal(false)

  const handleDelete = () => {
    setIsModalOpen(false)
    deleteMatrix(props.matrix_id())
    props.onClose()
  }

  const harmonics = getMatrixHarmonics(props.matrix_id)
  const matrixStore = getMatrix(props.matrix_id)

  type ColumnDefinition = {
    column_id: string
    column_name: string
  }

  const name = () => harmonics?.result?.matrix_name
  const columnSpecs = () =>
    harmonics?.result?.column_definitions.map((column: ColumnDefinition) => ({
      key: column.column_id,
      name: column.column_name,
    })) || []

  return (
    <Transition name="matrix-fade">
      <Show
        when={!harmonics.loading && !matrixStore.loading}
        fallback={<div>[ m load matrix .. ] [{props.matrix_id()}]</div>}
      >
        <Show
          when={!harmonics.error && !matrixStore.error}
          fallback={
            <div>
              [ m load error ! ] [{harmonics.error && ` ${harmonics.error} `}
              {matrixStore.error && ` ${matrixStore.error} `}]
            </div>
          }
        >
          <div class={styles.container}>
            <Lined>
              <div class={styles['header-container']}>
                <div style={{ display: 'flex' }}>
                  <Header margin={false}>{name()}</Header>{' '}
                  <Dimmed>[{props.matrix_id()}]</Dimmed>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                  <span style={{ color: 'red' }}>!</span> delete
                </Button>
                <Modal
                  isOpen={isModalOpen()}
                  onCloseRequest={() => setIsModalOpen(false)}
                  closeOnOutsideClick
                  contentClass={styles['modal-content']}
                  overlayClass={styles['modal-overlay']}
                >
                  <div>Are you sure you want to delete [{name()}]?</div>
                  <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => {
                      setIsModalOpen(false)
                      handleDelete()
                    }}
                  >
                    Delete
                  </Button>
                </Modal>
              </div>
            </Lined>
            <Table columns={columnSpecs()} data={matrixStore.result!} />
          </div>
        </Show>
      </Show>
    </Transition>
  )
}

export default Matrix
