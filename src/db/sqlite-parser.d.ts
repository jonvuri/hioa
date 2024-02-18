/* eslint-disable import/no-unused-modules */
declare module 'sqlite-parser' {
  type TableIdentifier = {
    type: 'identifier'
    variant: 'table'
    name: string
    alias?: string
    columns?: Identifier[]
  }

  type ColumnIdentifier = {
    type: 'identifier'
    variant: 'column'
    name: string
    alias?: string
  }

  type StarIdentifier = {
    type: 'identifier'
    variant: 'star'
  }

  type Identifier = TableIdentifier | ColumnIdentifier | StarIdentifier

  type Literal = {
    type: 'literal'
    variant: 'decimal' | 'text'
  }

  type Expression =
    | {
        type: 'expression'
        format: 'binary'
        variant: 'operation'
        operation: string
        left: Identifier | Literal
        right: Identifier | Literal
      }
    | {
        type: 'expression'
        variant: 'list'
        expression: (Identifier | Literal)[]
      }

  type Join = {
    type: 'join'
    variant: 'cross join'
    source: TableIdentifier
  }

  type JoinMap = {
    type: 'map'
    variant: 'join'
    source: TableIdentifier
    map: Join[]
  }

  type CreateStatement = {
    type: 'statement'
    variant: 'create'
    format: 'table'
    // Incomplete
  }
  type SelectStatement = {
    type: 'statement'
    variant: 'select'
    from: TableIdentifier | JoinMap
    result: Identifier[]
    where: Expression[]
  }
  type InsertStatement = {
    type: 'statement'
    variant: 'insert'
    action: 'insert'
    into: TableIdentifier
  }
  type UpdateStatement = {
    type: 'statement'
    variant: 'update'
    action: 'update'
  }
  type DeleteStatement = {
    type: 'statement'
    variant: 'delete'
    from: TableIdentifier
    where: Expression[]
  }
  type DropStatement = {
    type: 'statement'
    variant: 'drop'
    format: 'table'
    target: TableIdentifier
  }
  type TransactionStatement = {
    type: 'statement'
    variant: 'transaction'
    action: 'begin' | 'commit' | 'rollback'
  }
  type StatementList = {
    type: 'statement'
    variant: 'list'
    statement: (
      | CreateStatement
      | SelectStatement
      | InsertStatement
      | UpdateStatement
      | DeleteStatement
    )[]
  }

  export type SqliteStatement =
    | CreateStatement
    | SelectStatement
    | InsertStatement
    | UpdateStatement
    | DeleteStatement
    | DropStatement
    | TransactionStatement
    | StatementList

  export default function parse(sql: string): StatementList
}
