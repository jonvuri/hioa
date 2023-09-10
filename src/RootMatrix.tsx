import { Component } from 'solid-js'
import Table from 'solid-surfaces/components/Table'

const RootMatrix: Component = () => (
  <Table
    header={false}
    columns={[{ key: 'id', name: 'Matrices' }]}
    data={[{ id: 'empty' }]}
  />
)

export default RootMatrix
