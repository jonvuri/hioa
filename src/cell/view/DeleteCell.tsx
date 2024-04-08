import { Component, createSignal } from 'solid-js'
import Modal from '@lutaok/solid-modal'
import Button from 'solid-surfaces/components/Button'

import { deleteCellAndChildren } from '../harmonizer'
import { Cell } from '../types'

import styles from './DeleteCell.module.sass'

type Props = {
  cell: Cell
}

const DeleteCell: Component<Props> = (props) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = createSignal(false)

  const handleDelete = () => {
    setIsDeleteModalOpen(false)
    deleteCellAndChildren(props.cell)
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
        <div>Are you sure you want to delete cell [{props.cell.name}]?</div>
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

export default DeleteCell
