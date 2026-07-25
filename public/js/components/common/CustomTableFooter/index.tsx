// @ts-nocheck
/**
 * CustomTableFooter — Memoized
 *
 * Table with custom footer. All sub-components wrapped in React.memo.
 */
import React, { memo } from "react";

const TableHeader = memo(({ columns }) => {
  return (
    <thead className="text-primary border-b-4 border-primary bg-white sticky top-0 z-20 font-serif shadow-md">
      <tr>
        {columns.map((column, index) => (
          <th
            key={index}
            className="p-2 sm:p-4 md:p-6 text-xs text-left font-medium whitespace-nowrap"
            style={{ minWidth: "100px" }}
          >
            <span className="flex items-center gap-1 sm:gap-2">
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
    <tr className="transition-colors hover:bg-gray-50">
      {columns.map((column, index) => (
        <td
          key={index}
          className={`py-1 px-2 sm:px-3 h-full text-xs sm:text-sm text-gray-700 whitespace-nowrap border-b border-gray-100`}
          style={{
            width: `${(column.width / 24) * 100}%`,
            minWidth: "100px"
          }}
        >
          {column.render
            ? column.render(row[column.accessor], row, rowIndex)
            : (typeof row[column.accessor] === "object" && row[column.accessor] !== null
                ? JSON.stringify(row[column.accessor])
                : row[column.accessor] ?? "N/A")}
        </td>
      ))}
    </tr>
  );
});

const CustomTableFooter = memo(({ columns, rows, footer }) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-x-auto overflow-y-auto max-h-[750px] scrollbar-thin">
      <table className="min-w-full border-collapse table-auto">
        <TableHeader columns={columns} />
        <tbody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex} row={row} columns={columns} rowIndex={rowIndex} />
          ))}
        </tbody>
        {footer && footer}
      </table>
    </div>
  );
});

export default CustomTableFooter;
