// Types pour le composant DataTable avancé

export type SortDirection = 'asc' | 'desc' | null

export interface ColumnDef<T> {
  id: string
  header: string
  accessorKey?: keyof T
  accessorFn?: (row: T) => any
  cell?: (props: { row: T; value: any }) => React.ReactNode
  enableSorting?: boolean
  enableFiltering?: boolean
  filterType?: 'text' | 'select' | 'date' | 'number' | 'boolean'
  filterOptions?: { value: string; label: string }[]
  width?: number
  minWidth?: number
  maxWidth?: number
  hidden?: boolean
  editable?: boolean
  editType?: 'text' | 'select' | 'date' | 'number' | 'textarea'
  editOptions?: { value: string; label: string }[]
  onEdit?: (row: T, newValue: any) => Promise<void> | void
  className?: string
  headerClassName?: string
}

export interface RowAction<T> {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (row: T) => void
  variant?: 'default' | 'primary' | 'danger' | 'success' | 'warning'
  condition?: (row: T) => boolean
}

export interface BulkAction<T> {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (rows: T[]) => void
  variant?: 'default' | 'primary' | 'danger' | 'success' | 'warning'
  confirmMessage?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  rowActions?: RowAction<T>[]
  bulkActions?: BulkAction<T>[]
  getRowId: (row: T) => string
  onRowClick?: (row: T) => void
  onRowDoubleClick?: (row: T) => void
  onDelete?: (rows: T[]) => Promise<void> | void
  enableSelection?: boolean
  enablePagination?: boolean
  enableSearch?: boolean
  enableColumnVisibility?: boolean
  enableExport?: boolean
  enableRowNumbers?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
  searchPlaceholder?: string
  emptyMessage?: string
  loading?: boolean
  className?: string
  stickyHeader?: boolean
  striped?: boolean
  bordered?: boolean
  compact?: boolean
  title?: string
  subtitle?: string
  headerActions?: React.ReactNode
}

export interface DataTableState<T> {
  sorting: { column: string; direction: SortDirection }
  filters: Record<string, any>
  globalFilter: string
  pagination: { page: number; pageSize: number }
  selectedRows: Set<string>
  visibleColumns: Set<string>
  editingCell: { rowId: string; columnId: string } | null
}
