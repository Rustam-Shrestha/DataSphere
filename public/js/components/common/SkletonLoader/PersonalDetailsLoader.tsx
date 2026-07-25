// @ts-nocheck
const PersonalDetailsLoader = () => {
  return (
    <div className="animate-pulse flex h-screen w-full p-4 overflow-y-scroll z-10">
      <div className="grid grid-cols-6 w-full gap-6">
        {/* Left Section Skeleton */}
        <div className="col-span-2 flex flex-col gap-6">
          <div className="p-8 flex justify-between items-end w-full bg-gray-200 rounded-md">
            <div className="flex flex-col gap-2 text-sm font-serif font-semibold text-[#101828]">
              <div className="rounded-full w-[120px] h-[120px] bg-gray-300"></div>
              <div className="h-4 w-24 bg-gray-300 rounded-md"></div>
            </div>
            <div className="h-10 w-20 bg-gray-300 rounded-md"></div>
          </div>

          {/* Skeleton for Sections */}
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-[#F7F9F8] py-4 rounded-md">
              <div className="mt-2 px-8">
                <div className="h-4 w-32 bg-gray-300 rounded-md"></div>
              </div>
              <div className="grid grid-cols-2 gap-8 px-8 mt-4">
                {[...Array(2)].map((_, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="h-4 w-40 bg-gray-300 rounded-md"></div>
                    <div className="h-4 w-24 bg-gray-300 rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Section Skeleton */}
        <div className="col-span-4 p-8 grid grid-cols-1 gap-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-[#F7F9F8] py-4 rounded-md">
              <div className="mt-2 px-8">
                <div className="h-4 w-32 bg-gray-300 rounded-md"></div>
              </div>
              <div className="grid grid-cols-2 gap-8 px-8 mt-4">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="h-4 w-40 bg-gray-300 rounded-md"></div>
                    <div className="h-4 w-24 bg-gray-300 rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsLoader;
