import { Accessor, Component, createSignal } from 'solid-js'
import Modal from '@lutaok/solid-modal'
import Button from 'solid-surfaces/components/Button'

import { getMatrixHarmonics, deleteMatrix } from '../harmonizer'

import styles from './DeleteMatrix.module.sass'

type MatrixProps = {
  matrix_id: Accessor<string>
  onClose: () => void
}

const Matrix: Component<MatrixProps> = (props) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = createSignal(false)

  const [harmonicsRows] = getMatrixHarmonics(props.matrix_id)

  const name = () => harmonicsRows()?.matrix_name

  const handleDelete = () => {
    setIsDeleteModalOpen(false)
    deleteMatrix(props.matrix_id())
    props.onClose()
  }

  return (
    <>
      <Button onClick={() => setIsDeleteModalOpen(true)}>
        <span style={{ color: 'red' }}>!</span> delete
      </Button>
      <Modal
        isOpen={isDeleteModalOpen()}
        onCloseRequest={() => setIsDeleteModalOpen(false)}
        closeOnOutsideClick
        contentClass={styles['modal-content']}
        overlayClass={styles['modal-overlay']}
      >
        <div>Are you sure you want to delete matrix [{name()}]?</div>
        <Button onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
        <Button
          onClick={() => {
            setIsDeleteModalOpen(false)
            handleDelete()
          }}
        >
          Delete
        </Button>
      </Modal>
    </>
  )
}

export default Matrix
