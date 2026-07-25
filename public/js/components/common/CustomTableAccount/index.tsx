// @ts-nocheck
/**
 * CustomTableAccount — Memoized
 *
 * Table component with account-specific styling.
 * All sub-components wrapped in React.memo.
 */
import React, { memo } from "react";

const TableHeader = memo(({ columns, fitContentColumns = false }) => {
  return (
    <thead className="text-primary border-b-4 border-primary bg-white sticky top-0 z-20 font-serif shadow-md">
      <tr>
        {columns.map((column, index) => {
          if (!column) return null;
          return (
            <th
              key={index}
              className={`p-2 sm:p-4 md:p-6 text-xs text-left font-medium bg-primary text-white ${fitContentColumns ? "whitespace-nowrap" : "whitespace-normal"}`}
              style={{ minWidth: fitContentColumns ? "max-content" : "100px" }}
            >
              <span className="flex items-center gap-1 sm:gap-2">
                {column.isComponent ? column.label : <>{column.label}</>}
              </span>
            </th>
          );
        })}
      </tr>
    </thead>
  );
});

const TableRow = memo(({ row, columns, rowIndex, fitContentColumns = false }) => {
  if (row.isDivider) {
    return (
      <tr>
        <td colSpan={columns.length} className="py-1 px-4">
          <div className="border-t-2 border-primary/20 my-1"></div>
        </td>
      </tr>
    );
  }
  return (
    <tr className="transition-colors hover:bg-gray-50">
      {columns.map((column, index) => {
        if (!column) return null;
        return (
          <td
            key={index}
            className={`py-1 px-2 sm:px-3 h-full text-xs sm:text-sm text-gray-700 border-b border-gray-100 ${fitContentColumns ? "whitespace-nowrap" : "whitespace-normal align-top"}`}
            style={{
              width: fitContentColumns ? "max-content" : (column.width ? `${(column.width / 24) * 100}%` : "auto"),
              minWidth: fitContentColumns ? "max-content" : "100px"
            }}
          >
            {column.render
              ? column.render(row[column.accessor], row, rowIndex)
              : column.accessor
                ? (typeof row[column.accessor] === "object" && row[column.accessor] !== null
                    ? JSON.stringify(row[column.accessor])
                    : row[column.accessor] ?? "N/A")
                : "N/A"}
          </td>
        );
      })}
    </tr>
  );
});

const TableFooter = memo(({ footer }) => {
  return (
    <tfoot className="bg-[#E2EDE3] border-t-4 border-primary sticky bottom-0 z-20 shadow-md">
      <tr>
        <td colSpan="100%" className="py-2 px-2 sm:px-4 font-bold text-primary text-xs sm:text-sm">
          {footer}
        </td>
      </tr>
    </tfoot>
  );
});

const CustomTableFooter = memo(({ footers, columns, fitContentColumns = false }) => {
  return (
    <tfoot className="bg-[#E2EDE3] border-t-4 border-primary sticky bottom-0 z-20 shadow-md">
      <tr>
        {footers.map((footer, index) => (
          <td
            key={index}
            className={`py-2 px-2 sm:px-4 font-bold text-primary text-xs sm:text-sm ${fitContentColumns ? "whitespace-nowrap" : "whitespace-normal"}`}
            style={{
              width: fitContentColumns ? "max-content" : (columns[index]?.width ? `${(columns[index].width / 24) * 100}%` : "auto"),
              minWidth: fitContentColumns ? "max-content" : "100px"
            }}
          >
            {footer}
          </td>
        ))}
      </tr>
    </tfoot>
  );
});

const CustomTableAccount = memo(({ columns, rows, footer, customTableFooter, allowOverflowVisible = false, fitContentColumns = false }) => {
  const containerClassName = fitContentColumns
    ? "w-full max-w-full bg-white rounded-lg shadow-md overflow-auto max-h-[750px] scrollbar-thin"
    : allowOverflowVisible
      ? "w-full bg-white rounded-lg shadow-md overflow-visible max-h-none scrollbar-thin"
      : "w-full bg-white rounded-lg shadow-md overflow-x-auto overflow-y-auto max-h-[750px] scrollbar-thin";

  return (
    <div className={containerClassName}>
      <table className={`${fitContentColumns ? "w-max" : "min-w-full"} border-collapse table-auto`}>
        <TableHeader columns={columns} fitContentColumns={fitContentColumns} />
        <tbody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex} row={row} columns={columns} rowIndex={rowIndex} fitContentColumns={fitContentColumns} />
          ))}
        </tbody>
        {footer && <TableFooter footer={footer} />}
        {customTableFooter && <CustomTableFooter footers={customTableFooter} columns={columns} fitContentColumns={fitContentColumns} />}
      </table>
    </div>
  );
});

export default CustomTableAccount;
