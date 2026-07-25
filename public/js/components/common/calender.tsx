// @ts-nocheck
/**
 * Calendar Component — Memoized
 *
 * Simple date display component. Wrapped in React.memo since
 * it has no props and only depends on the current date.
 */
import React, { memo } from "react";
import { CalenderIcon } from "../../assets/data/icons";

const Calendar = memo(() => {
  // Format the date (e.g., "24 Jan 2024")
  const formatDate = (date) => {
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return new Intl.DateTimeFormat("en-US", options).format(date);
  };

  return (
    <div className="flex cursor-pointer items-center justify-center text-xs font-light gap-2">
      <CalenderIcon />
      <span className="text-sm text-white">{formatDate(new Date())}</span>
    </div>
  );
});

export default Calendar;
