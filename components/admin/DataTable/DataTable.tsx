'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Settings2,
  Trash2,
  MoreHorizontal,
  Check,
  X,
  Edit2,
  Loader2,
  Filter,
  RefreshCw,
} from 'lucide-react'
import type { ColumnDef, DataTableProps, DataTableState, SortDirection, RowAction, BulkAction } from './types'

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  rowActions = [],
  bulkActions = [],
  getRowId,
  onRowClick,
  onRowDoubleClick,
  onDelete,
  enableSelection = true,
  enablePagination = true,
  enableSearch = true,
  enableColumnVisibility = true,
  enableExport = true,
  enableRowNumbers = false,
  pageSize: initialPageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  searchPlaceholder = 'Rechercher...',
  emptyMessage = 'Aucune donnée',
  loading = false,
  className = '',
  stickyHeader = true,
  striped = true,
  bordered = false,
  compact = false,
  title,
  subtitle,
  headerActions,
}: DataTableProps<T>) {
  // State
  const [state, setState] = useState<DataTableState<T>>({
    sorting: { column: '', direction: null },
    filters: {},
    globalFilter: '',
    pagination: { page: 1, pageSize: initialPageSize },
    selectedRows: new Set<string>(),
    visibleColumns: new Set(columns.filter(c => !c.hidden).map(c => c.id)),
    editingCell: null,
  })

  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const [showFiltersMenu, setShowFiltersMenu] = useState(false)
  const [editValue, setEditValue] = useState<any>('')

  // Helpers
  const getCellValue = useCallback((row: T, column: ColumnDef<T>): any => {
    if (column.accessorFn) return column.accessorFn(row)
    if (column.accessorKey) return row[column.accessorKey]
    return null
  }, [])

  // Filtered & Sorted Data
  const processedData = useMemo(() => {
    let result = [...data]

    // Global filter
    if (state.globalFilter) {
      const searchLower = state.globalFilter.toLowerCase()
      result = result.filter(row =>
        columns.some(col => {
          const value = getCellValue(row, col)
          if (value === null || value === undefined) return false
          return String(value).toLowerCase().includes(searchLower)
        })
      )
    }

    // Column filters
    Object.entries(state.filters).forEach(([columnId, filterValue]) => {
      if (filterValue === '' || filterValue === null || filterValue === undefined) return
      const column = columns.find(c => c.id === columnId)
      if (!column) return

      result = result.filter(row => {
        const value = getCellValue(row, column)
        if (column.filterType === 'select') {
          return value === filterValue
        }
        return String(value).toLowerCase().includes(String(filterValue).toLowerCase())
      })
    })

    // Sorting
    if (state.sorting.column && state.sorting.direction) {
      const column = columns.find(c => c.id === state.sorting.column)
      if (column) {
        result.sort((a, b) => {
          const aVal = getCellValue(a, column)
          const bVal = getCellValue(b, column)

          if (aVal === null || aVal === undefined) return 1
          if (bVal === null || bVal === undefined) return -1

          let comparison = 0
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            comparison = aVal.localeCompare(bVal)
          } else if (aVal instanceof Date && bVal instanceof Date) {
            comparison = aVal.getTime() - bVal.getTime()
          } else {
            comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
          }

          return state.sorting.direction === 'desc' ? -comparison : comparison
        })
      }
    }

    return result
  }, [data, state.globalFilter, state.filters, state.sorting, columns, getCellValue])

  // Pagination
  const totalPages = Math.ceil(processedData.length / state.pagination.pageSize)
  const paginatedData = useMemo(() => {
    if (!enablePagination) return processedData
    const start = (state.pagination.page - 1) * state.pagination.pageSize
    return processedData.slice(start, start + state.pagination.pageSize)
  }, [processedData, state.pagination, enablePagination])

  // Visible columns
  const visibleColumns = useMemo(
    () => columns.filter(c => state.visibleColumns.has(c.id)),
    [columns, state.visibleColumns]
  )

  // Selection
  const allSelected = paginatedData.length > 0 && paginatedData.every(row => state.selectedRows.has(getRowId(row)))
  const someSelected = paginatedData.some(row => state.selectedRows.has(getRowId(row)))

  const toggleSelectAll = useCallback(() => {
    setState(prev => {
      const newSelected = new Set(prev.selectedRows)
      if (allSelected) {
        paginatedData.forEach(row => newSelected.delete(getRowId(row)))
      } else {
        paginatedData.forEach(row => newSelected.add(getRowId(row)))
      }
      return { ...prev, selectedRows: newSelected }
    })
  }, [allSelected, paginatedData, getRowId])

  const toggleSelectRow = useCallback((rowId: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedRows)
      if (newSelected.has(rowId)) {
        newSelected.delete(rowId)
      } else {
        newSelected.add(rowId)
      }
      return { ...prev, selectedRows: newSelected }
    })
  }, [])

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedRows: new Set() }))
  }, [])

  // Sorting
  const toggleSort = useCallback((columnId: string) => {
    setState(prev => {
      let newDirection: SortDirection = 'asc'
      if (prev.sorting.column === columnId) {
        if (prev.sorting.direction === 'asc') newDirection = 'desc'
        else if (prev.sorting.direction === 'desc') newDirection = null
      }
      return {
        ...prev,
        sorting: { column: columnId, direction: newDirection },
      }
    })
  }, [])

  // Pagination controls
  const goToPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page: Math.max(1, Math.min(page, totalPages)) },
    }))
  }, [totalPages])

  const setPageSize = useCallback((size: number) => {
    setState(prev => ({
      ...prev,
      pagination: { page: 1, pageSize: size },
    }))
  }, [])

  // Export
  const exportToCSV = useCallback(() => {
    const headers = visibleColumns.map(c => c.header)
    const rows = processedData.map(row =>
      visibleColumns.map(col => {
        const value = getCellValue(row, col)
        return value === null || value === undefined ? '' : String(value)
      })
    )

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `export_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }, [visibleColumns, processedData, getCellValue])

  // Edit cell
  const startEditing = useCallback((rowId: string, columnId: string, currentValue: any) => {
    setState(prev => ({ ...prev, editingCell: { rowId, columnId } }))
    setEditValue(currentValue)
  }, [])

  const cancelEditing = useCallback(() => {
    setState(prev => ({ ...prev, editingCell: null }))
    setEditValue('')
  }, [])

  const saveEdit = useCallback(async (row: T, column: ColumnDef<T>) => {
    if (column.onEdit) {
      await column.onEdit(row, editValue)
    }
    cancelEditing()
  }, [editValue, cancelEditing])

  // Column visibility
  const toggleColumnVisibility = useCallback((columnId: string) => {
    setState(prev => {
      const newVisible = new Set(prev.visibleColumns)
      if (newVisible.has(columnId)) {
        newVisible.delete(columnId)
      } else {
        newVisible.add(columnId)
      }
      return { ...prev, visibleColumns: newVisible }
    })
  }, [])

  // Filters
  const setColumnFilter = useCallback((columnId: string, value: any) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [columnId]: value },
      pagination: { ...prev.pagination, page: 1 },
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {},
      globalFilter: '',
      pagination: { ...prev.pagination, page: 1 },
    }))
  }, [])

  // Selected rows data
  const selectedRowsData = useMemo(
    () => data.filter(row => state.selectedRows.has(getRowId(row))),
    [data, state.selectedRows, getRowId]
  )

  const hasActiveFilters = state.globalFilter || Object.values(state.filters).some(v => v !== '' && v !== null)

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            {title && <h2 className="text-xl font-bold">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            {enableSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={state.globalFilter}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    globalFilter: e.target.value,
                    pagination: { ...prev.pagination, page: 1 },
                  }))}
                  placeholder={searchPlaceholder}
                  className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            {/* Filters button */}
            <div className="relative">
              <button
                onClick={() => setShowFiltersMenu(!showFiltersMenu)}
                className={`p-2 rounded-lg border transition-colors ${
                  hasActiveFilters
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Filtres"
              >
                <Filter className="h-4 w-4" />
              </button>

              {showFiltersMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Filtres</h3>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-primary hover:underline"
                      >
                        Effacer tout
                      </button>
                    )}
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {columns.filter(c => c.enableFiltering !== false).map(column => (
                      <div key={column.id}>
                        <label className="block text-sm font-medium mb-1">{column.header}</label>
                        {column.filterType === 'select' && column.filterOptions ? (
                          <select
                            value={state.filters[column.id] || ''}
                            onChange={(e) => setColumnFilter(column.id, e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                          >
                            <option value="">Tous</option>
                            {column.filterOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={state.filters[column.id] || ''}
                            onChange={(e) => setColumnFilter(column.id, e.target.value)}
                            placeholder={`Filtrer ${column.header.toLowerCase()}...`}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Column visibility */}
            {enableColumnVisibility && (
              <div className="relative">
                <button
                  onClick={() => setShowColumnMenu(!showColumnMenu)}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Colonnes"
                >
                  <Settings2 className="h-4 w-4" />
                </button>

                {showColumnMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 p-2">
                    <div className="text-sm font-semibold px-2 py-1 mb-1">Colonnes visibles</div>
                    {columns.map(column => (
                      <label
                        key={column.id}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={state.visibleColumns.has(column.id)}
                          onChange={() => toggleColumnVisibility(column.id)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{column.header}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Export */}
            {enableExport && (
              <button
                onClick={exportToCSV}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Exporter CSV"
              >
                <Download className="h-4 w-4" />
              </button>
            )}

            {headerActions}
          </div>
        </div>

        {/* Bulk actions bar */}
        {state.selectedRows.size > 0 && (
          <div className="mt-4 flex items-center gap-4 p-3 bg-primary/10 rounded-lg">
            <span className="text-sm font-medium">
              {state.selectedRows.size} élément{state.selectedRows.size > 1 ? 's' : ''} sélectionné{state.selectedRows.size > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              {bulkActions.map(action => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      if (action.confirmMessage) {
                        if (confirm(action.confirmMessage)) {
                          action.onClick(selectedRowsData)
                          clearSelection()
                        }
                      } else {
                        action.onClick(selectedRowsData)
                        clearSelection()
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      action.variant === 'danger'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : action.variant === 'success'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : action.variant === 'warning'
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : action.variant === 'primary'
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {action.label}
                  </button>
                )
              })}
              {onDelete && (
                <button
                  onClick={() => {
                    if (confirm(`Supprimer ${state.selectedRows.size} élément(s) ?`)) {
                      onDelete(selectedRowsData)
                      clearSelection()
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              )}
            </div>
            <button
              onClick={clearSelection}
              className="ml-auto text-sm text-gray-600 dark:text-gray-400 hover:underline"
            >
              Annuler la sélection
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className={`w-full ${compact ? 'text-sm' : ''}`}>
          <thead className={`bg-gray-50 dark:bg-gray-900 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {/* Row numbers */}
              {enableRowNumbers && (
                <th className="w-12 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  #
                </th>
              )}

              {/* Selection checkbox */}
              {enableSelection && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected
                    }}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </th>
              )}

              {/* Column headers */}
              {visibleColumns.map(column => (
                <th
                  key={column.id}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    column.enableSorting !== false ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800' : ''
                  } ${column.headerClassName || ''}`}
                  style={{ width: column.width, minWidth: column.minWidth, maxWidth: column.maxWidth }}
                  onClick={() => column.enableSorting !== false && toggleSort(column.id)}
                >
                  <div className="flex items-center gap-1">
                    <span>{column.header}</span>
                    {column.enableSorting !== false && (
                      <span className="text-gray-400">
                        {state.sorting.column === column.id ? (
                          state.sorting.direction === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : state.sorting.direction === 'desc' ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronsUpDown className="h-4 w-4 opacity-50" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}

              {/* Actions column */}
              {rowActions.length > 0 && (
                <th className="w-20 px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${bordered ? 'border' : ''}`}>
            {loading ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (enableSelection ? 1 : 0) + (enableRowNumbers ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)}
                  className="px-6 py-12 text-center"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="mt-2 text-gray-500">Chargement...</p>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (enableSelection ? 1 : 0) + (enableRowNumbers ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const rowId = getRowId(row)
                const isSelected = state.selectedRows.has(rowId)
                const absoluteIndex = (state.pagination.page - 1) * state.pagination.pageSize + rowIndex + 1

                return (
                  <tr
                    key={rowId}
                    className={`
                      ${striped && rowIndex % 2 === 1 ? 'bg-gray-50 dark:bg-gray-900/50' : ''}
                      ${isSelected ? 'bg-primary/5' : ''}
                      ${onRowClick ? 'cursor-pointer' : ''}
                      hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors
                    `}
                    onClick={() => onRowClick?.(row)}
                    onDoubleClick={() => onRowDoubleClick?.(row)}
                  >
                    {/* Row number */}
                    {enableRowNumbers && (
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {absoluteIndex}
                      </td>
                    )}

                    {/* Selection checkbox */}
                    {enableSelection && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(rowId)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </td>
                    )}

                    {/* Data cells */}
                    {visibleColumns.map(column => {
                      const value = getCellValue(row, column)
                      const isEditing = state.editingCell?.rowId === rowId && state.editingCell?.columnId === column.id

                      return (
                        <td
                          key={column.id}
                          className={`px-4 py-3 ${column.className || ''}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              {column.editType === 'select' && column.editOptions ? (
                                <select
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="px-2 py-1 text-sm border border-primary rounded focus:ring-2 focus:ring-primary"
                                  autoFocus
                                >
                                  {column.editOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              ) : column.editType === 'textarea' ? (
                                <textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="px-2 py-1 text-sm border border-primary rounded focus:ring-2 focus:ring-primary"
                                  rows={2}
                                  autoFocus
                                />
                              ) : (
                                <input
                                  type={column.editType === 'number' ? 'number' : column.editType === 'date' ? 'date' : 'text'}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="px-2 py-1 text-sm border border-primary rounded focus:ring-2 focus:ring-primary w-full"
                                  autoFocus
                                />
                              )}
                              <button
                                onClick={() => saveEdit(row, column)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {column.cell ? (
                                column.cell({ row, value })
                              ) : (
                                <span className="text-sm">{value === null || value === undefined ? '-' : String(value)}</span>
                              )}
                              {column.editable && (
                                <button
                                  onClick={() => startEditing(rowId, column.id, value)}
                                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )
                    })}

                    {/* Row actions */}
                    {rowActions.length > 0 && (
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {rowActions.filter(action => !action.condition || action.condition(row)).map(action => {
                            const Icon = action.icon
                            return (
                              <button
                                key={action.id}
                                onClick={() => action.onClick(row)}
                                className={`p-1.5 rounded transition-colors ${
                                  action.variant === 'danger'
                                    ? 'text-red-600 hover:bg-red-50'
                                    : action.variant === 'success'
                                    ? 'text-green-600 hover:bg-green-50'
                                    : action.variant === 'warning'
                                    ? 'text-amber-600 hover:bg-amber-50'
                                    : action.variant === 'primary'
                                    ? 'text-primary hover:bg-primary/10'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                title={action.label}
                              >
                                {Icon ? <Icon className="h-4 w-4" /> : action.label}
                              </button>
                            )
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      {enablePagination && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Affichage de {((state.pagination.page - 1) * state.pagination.pageSize) + 1} à{' '}
              {Math.min(state.pagination.page * state.pagination.pageSize, processedData.length)} sur{' '}
              {processedData.length} résultat{processedData.length > 1 ? 's' : ''}
              {data.length !== processedData.length && ` (${data.length} total)`}
            </div>

            <div className="flex items-center gap-4">
              {/* Page size selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Lignes:</span>
                <select
                  value={state.pagination.pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                >
                  {pageSizeOptions.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              {/* Pagination controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(1)}
                  disabled={state.pagination.page === 1}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => goToPage(state.pagination.page - 1)}
                  disabled={state.pagination.page === 1}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1 px-2">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={state.pagination.page}
                    onChange={(e) => goToPage(Number(e.target.value))}
                    className="w-12 px-2 py-1 text-sm text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-500">/ {totalPages}</span>
                </div>

                <button
                  onClick={() => goToPage(state.pagination.page + 1)}
                  disabled={state.pagination.page === totalPages}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={state.pagination.page === totalPages}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside handlers */}
      {(showColumnMenu || showFiltersMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowColumnMenu(false)
            setShowFiltersMenu(false)
          }}
        />
      )}
    </div>
  )
}

export default DataTable
