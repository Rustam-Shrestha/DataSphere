// @ts-nocheck
const SkeletonTableLoader = () => {
  const columns = Array.from({ length: 6 }); // Placeholder for 10 columns
  const rows = Array.from({ length: 7 }); // Placeholder for 10 rows

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-auto max-h-[750px]">
      <table className="min-w-full border-collapse">
        {/* Table Header Skeleton */}
        <thead className="text-gray-600 border-b-4 border-primary bg-white sticky top-0 z-10 font-serif">
          <tr>
            {columns.map((_, index) => (
              <th
                key={index}
                className="py-4 px-4 text-xs text-left font-medium"
              >
                <div className="h-6 bg-gray-300 rounded animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body Skeleton */}
        <tbody>
          {rows.map((_, rowIndex) => (
            <tr key={rowIndex} className="transition-colors">
              {columns.map((_, colIndex) => (
                <td key={colIndex} className="py-3 px-4 text-sm">
                  <div className="h-20 bg-gray-300 rounded animate-pulse"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>

        {/* Table Footer Skeleton */}
        <tfoot className="bg-[#E2EDE3] border-t border-green-500 sticky bottom-0 z-10">
          <tr>
            <td colSpan="100%" className="p-4 font-bold text-gray-600 text-sm">
              <div className="h-4 bg-gray-300 rounded animate-pulse w-24"></div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

const SkeletonTable = () => {
  const columns = Array.from({ length: 6 }); // Placeholder for 10 columns
  const rows = Array.from({ length: 7 }); // Placeholder for 10 rows

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-auto max-h-[750px]">
      <table className="min-w-full border-collapse">
        {/* Table Body Skeleton */}
        <tbody>
          {rows.map((_, rowIndex) => (
            <tr key={rowIndex} className="transition-colors">
              {columns.map((_, colIndex) => (
                <td key={colIndex} className="py-3 px-4 text-sm">
                  <div className="h-20 bg-gray-300 rounded animate-pulse"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>

        {/* Table Footer Skeleton */}
        <tfoot className="bg-[#E2EDE3] border-t border-green-500 sticky bottom-0 z-10">
          <tr>
            <td colSpan="100%" className="p-4 font-bold text-gray-600 text-sm">
              <div className="h-4 bg-gray-300 rounded animate-pulse w-24"></div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

const CircularLoader = ({ variant = "secondary" }) => {
  return (
    <span
      className={`inline-block w-5 h-5 border-4 border-t-transparent ${
        variant === "secondary" ? "border-primary" : "border-white"
      }  rounded-full animate-spin`}
    ></span>
  );
};

export { CircularLoader, SkeletonTable, SkeletonTableLoader };
