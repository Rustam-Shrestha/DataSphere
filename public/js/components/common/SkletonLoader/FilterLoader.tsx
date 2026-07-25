// @ts-nocheck
const FilterLoader = () => {
  return (
    <div className="w-40 bg-gray-200">
      {[...Array(1)].map((_, index) => (
        <div key={index} className="bg-white p-4 rounded-md animate-pulse">
          <div className="mt-3 space-y-7">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="h-3 w-32 bg-gray-300 rounded-md"></div> // Filter options
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FilterLoader;
