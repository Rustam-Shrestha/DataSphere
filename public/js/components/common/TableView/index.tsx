// @ts-nocheck
/**
 * TableView — Memoized
 *
 * Main data table with search, pagination, expandable rows.
 * All sub-components wrapped in React.memo.
 */
import React, { memo, useState } from "react";
import { SearchIcon } from "../../../assets/data/icons";
import InputField from "../InputField";
import { SkeletonTable } from "../SkletonLoader/index";
import { ChevronDown } from "lucide-react";

const TableHeader = memo(({ columns, onFilterChange, hasExpandableRows }) => {
  const [showSearch, setShowSearch] = useState(null);

  const handleSearchChange = (accessor, value) => {
    onFilterChange(accessor, value);
  };

  const closeSearch = (accessor) => {
    onFilterChange(accessor, null);
    setShowSearch(null);
  };

  return (
    <thead className="text-primary border-b-4 border-primary sticky top-0 z-50 font-serif shadow-md" style={{ backgroundColor: 'var(--surface-color)' }}>
      <tr>
        {hasExpandableRows && (
          <th className="p-3 sm:p-4 text-xs text-left font-medium w-10"></th>
        )}
        {columns.map((column, index) => (
          <th
            key={index}
            className="p-4 sm:p-6 text-xs text-left font-medium whitespace-nowrap"
            style={{ 
              width: `${(column.width / 24) * 100}%`,
              minWidth: column.accessor === "sn" ? "60px" : column.accessor === "name" || column.accessor === "client" ? "200px" : "120px"
            }}
          >
            {showSearch === column.accessor ? (
              <div className="relative w-full min-w-[120px]">
                <InputField
                  name={column.accessor}
                  label=""
                  type="text"
                  placeholder={`Search ${column.label.toLowerCase()}...`}
                  onChange={(e) =>
                    handleSearchChange(column.accessor, e.target.value)
                  }
                  className="w-full pr-8 text-xs sm:text-sm py-1"
                />
                <button
                  onClick={() => closeSearch(column.accessor)}
                  className="absolute top-1 right-0 bg-danger-500 text-gray-600 text-lg px-2 py-0 rounded-full rounded-e-none bg-[#F6F6F6] hover:bg-primary hover:text-white"
                >
                  &times;
                </button>
              </div>
            ) : (
              <span className="flex items-center gap-1">
                {column.isComponent ? column.label : <>{column.label}</>}
                {!column.isComponent && column.isSearch && (
                  <SearchIcon
                    onClick={() => setShowSearch(column.accessor)}
                    className="text-primary cursor-pointer w-3 h-3 sm:w-4 sm:h-4"
                  />
                )}
              </span>
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
});

const TableRow = memo(({ row, columns, hasExpandableRows, isExpanded, onToggleExpand }) => {
  const hasChildren = !!row.children;

  return (
    <>
      <tr className="transition-colors hover:bg-gray-50 :bg-gray-800">
        {hasExpandableRows && (
          <td className="py-2 px-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
            {hasChildren ? (
              <button
                onClick={() => onToggleExpand(row.id)}
                className={`p-1 rounded transition-all duration-200 hover:bg-gray-200 :bg-gray-700 ${isExpanded ? 'bg-primary/10' : ''}`}
              >
                <ChevronDown 
                  className={`w-4 h-4 text-primary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>
            ) : (
              <span className="w-6 h-6 inline-block"></span>
            )}
          </td>
        )}
        {columns.map((column, index) => (
          <td
            key={index}
            className={`py-2 px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap border-b`}
            style={{ 
              color: 'var(--text-color)',
              borderColor: 'var(--border-color)',
              width: `${(column.width / 24) * 100}%`,
              minWidth: column.accessor === "sn" ? "60px" : column.accessor === "name" || column.accessor === "client" ? "200px" : "120px"
            }}
          >
            {column.render
              ? column.render(row[column.accessor], row)
              : (typeof row[column.accessor] === "object" && row[column.accessor] !== null
                  ? JSON.stringify(row[column.accessor])
                  : row[column.accessor] ?? "N/A")}{" "}
          </td>
        ))}
      </tr>
      {/* Expandable content row */}
      {hasExpandableRows && hasChildren && isExpanded && (
        <tr style={{ backgroundColor: 'var(--surface-muted)' }}>
          <td colSpan={columns.length + 1} className="p-0">
            {row.children}
          </td>
        </tr>
      )}
    </>
  );
});

const TableFooter = memo(({
  totalCount = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
}) => {
  const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1;

  // Limit visible page buttons for better compactness
  const getVisiblePages = () => {
    const delta = 1; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <tfoot className="border-t border-primary sticky bottom-0 z-20 shadow-sm" style={{ backgroundColor: 'var(--green-footer)', borderColor: 'var(--border-color)' }}>
      <tr>
        <td colSpan="100%" className="p-2 font-bold text-primary text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="whitespace-nowrap text-xs sm:text-sm" style={{ color: 'var(--text-color)' }}>
              Total: {totalCount}
            </span>

            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-1 bg-primary text-white rounded text-xs sm:text-sm disabled:opacity-50 hover:bg-primary-dark transition-colors duration-200 flex-shrink-0"
              >
                ‹
              </button>

              <div className="flex gap-1">
                {getVisiblePages().map((page, index) =>
                  page === "..." ? (
                    <span key={index} className="px-1 sm:px-2 py-1 text-xs sm:text-sm" style={{ color: 'var(--gray-column-text)' }}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={index}
                      onClick={() => onPageChange(page)}
                      className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-colors duration-200 flex-shrink-0 ${
                        currentPage === page
                          ? "bg-primary text-white hover:bg-primary-dark"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300   :bg-gray-600"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-1 bg-primary text-white rounded text-xs sm:text-sm disabled:opacity-50 hover:bg-primary-dark transition-colors duration-200 flex-shrink-0"
              >
                ›
              </button>
            </div>
          </div>
        </td>
      </tr>
    </tfoot>
  );
});

const TableView = memo(({
  columns,
  rows,
  totalCount,
  onFilterChange,
  currentPage,
  pageSize,
  onPageChange,
  loading,
  footer,
  customHeader,
}) => {
  const [expandedRows, setExpandedRows] = useState({});

  // Check if any row has children (expandable content)
  const hasExpandableRows = rows.some((row) => row.children);

  const toggleExpand = (rowId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  return (
    <div className="w-full rounded-lg shadow-sm" style={{ backgroundColor: 'var(--surface-color)' }}>
      {customHeader && customHeader}
      <div className="overflow-x-auto overflow-y-auto max-h-[650px] scrollbar-thin border rounded-b-lg" style={{ borderColor: 'var(--border-color)' }}>
        <table className="min-w-full border-collapse table-auto text-sm">
          <TableHeader
            columns={columns}
            onFilterChange={onFilterChange}
            hasExpandableRows={hasExpandableRows}
          />
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (hasExpandableRows ? 1 : 0)}>
                  <SkeletonTable
                    rowCount={8}
                    columnCount={columns.length}
                    compact={true}
                  />
                </td>
              </tr>
            ) : rows.length > 0 ? (
              rows.map((row, rowIndex) => (
                <TableRow
                  key={row.id || rowIndex}
                  row={row}
                  columns={columns}
                  hasExpandableRows={hasExpandableRows}
                  isExpanded={expandedRows[row.id]}
                  onToggleExpand={toggleExpand}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (hasExpandableRows ? 1 : 0)}
                  className="py-6 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 mb-2" style={{ color: 'var(--gray-column-text)' }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-base font-semibold" style={{ color: 'var(--text-color)' }}>
                      No results found
                    </p>
                    <p className="text-xs" style={{ color: 'var(--gray-column-text)' }}>
                      Try adjusting your search or filters.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          {footer && footer}

          <TableFooter
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </table>
      </div>
    </div>
  );
});

export default TableView;
