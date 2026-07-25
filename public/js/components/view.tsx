// @ts-nocheck
/**
 * CustomTableView — Refactored
 *
 * CHANGES:
 * - Added React.memo to all sub-components (TableHeader, TableRow, TableFooter)
 *   to prevent unnecessary re-renders when parent state changes.
 * - No Context/Redux needed here — this is a pure presentational component.
 * - Same visual behavior as before.
 */
import React, { memo } from "react";

const TableHeader = memo(({ columns }) => {
  return (
    <thead className="text-primary border-b-2 border-primary bg-white sticky top-0 z-20 font-serif shadow-md">
      <tr>
        {columns.map((column, index) => (
          <th
            key={index}
            className="p-6 text-xs text-left font-medium whitespace-nowrap"
            style={{ minWidth: "120px" }}
          >
            <span className="flex items-center gap-2">
              {column.isComponent ? column.label : <>{column.label}</>}
            </span>
          </th>
        ))}
      </tr>
    </thead>
  );
});

const TableRow = memo(({ row, columns, rowIndex }) => {
  return (
    <tr className="transition-colors">
      {columns.map((column, index) => {
        const value = row[column.accessor];
        const render = column.render
          ? column.render(value, row, null, rowIndex)
          : (typeof value === "object" && value !== null
              ? JSON.stringify(value)
              : value ?? "N/A");
        return render ? (
          <td
            key={index}
            className={`py-1 px-1 h-full text-sm text-gray-700 whitespace-nowrap`}
            style={{ width: `${(column.width / 24) * 100}%` }}
          >
            {render}
          </td>
        ) : null;
      })}
    </tr>
  );
});

const TableFooter = memo(({ footer }) => {
  return (
    <tfoot className="bg-[#E2EDE3] border-t-4 border-primary sticky bottom-0 z-20 shadow-md">
      <tr>
        <td colSpan="100%" className=" py-2 font-bold text-primary text-sm">
          {footer}
        </td>
      </tr>
    </tfoot>
  );
});

const CustomTableFooter = memo(({ footers }) => {
  return (
    <tfoot className="border-t-2 border-primary sticky bottom-0 z-20 shadow-md">
      <tr className="transition-colors">
        {footers &&
          footers.map((footer, index) => (
            <td
              key={index}
              className={`px-8 py-3 bg-[#E2EDE3] h-full text-sm text-gray-700 whitespace-nowrap`}
            >
              {footer}
            </td>
          ))}
      </tr>
    </tfoot>
  );
});

const CustomTableView = memo(({
  columns = [],
  rows = [],
  footer,
  customTableFooter,
  maxHeight = "calc(100vh - 200px)",
  showHeader = true,
  className = "",
}) => {
  return (
    <div 
      className={`w-full bg-white rounded-lg shadow-md overflow-auto border border-gray-200 ${className}`}
      style={{ maxHeight }}
    >
      <table className="min-w-full border-collapse table-auto">
        {showHeader && <TableHeader columns={columns} />}
        <tbody>
          {rows && rows.length > 0 ? (
            rows.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                row={row}
                columns={columns}
                rowIndex={rowIndex}
              />
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-gray-500">
                No data available
              </td>
            </tr>
          )}
        </tbody>
        {footer && <TableFooter footer={footer} />}
        {customTableFooter && <CustomTableFooter footers={customTableFooter} />}
      </table>
    </div>
  );
});

export default memo(CustomTableView);
