// @ts-nocheck
/**
 * CustomDatePicker — Memoized
 */
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalenderIcon, LeftIcon, RightIcon } from "../../../assets/data/icons";
import { parseDateString } from "../../../helper";
import useClickOutside from "../../../hooks/useClickOutside";

const CustomDatePicker = memo(({
  label = null,
  name = "datePicker",
  value,
  isForm = false,
  onChange,
  error,
  compact = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef(null);
  const dropdownRef = useClickOutside(() => setIsOpen(false), [popupRef]);
  const [selectedDate, setSelectedDate] = useState(
    value ? parseDateString(value) : new Date()
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [popupStyle, setPopupStyle] = useState({});
  const [calendarWidth, setCalendarWidth] = useState(320);

  useEffect(() => {
    if (!value) {
      const today = new Date();
      setSelectedDate(today);
      setCurrentMonth(today);
      return;
    }

    const parsedValue = parseDateString(value);
    if (parsedValue instanceof Date && !Number.isNaN(parsedValue.getTime())) {
      setSelectedDate(parsedValue);
      setCurrentMonth(parsedValue);
    }
  }, [value]);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Generate dates for the current month
  const generateCalendarDates = () => {
    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    const dates = [];
    const startDate = new Date(firstDayOfMonth);

    // Adjust to start on Monday
    while (startDate.getDay() !== 1) {
      startDate.setDate(startDate.getDate() - 1);
    }

    const endDate = new Date(lastDayOfMonth);
    while (endDate.getDay() !== 0) {
      endDate.setDate(endDate.getDate() + 1);
    }

    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      dates.push(new Date(date));
    }

    return dates;
  };

  const handleDateClick = (date) => {
    if (disabled) return;

    setSelectedDate(date);
    setIsOpen(false);
    const formattedDate = formatDate(date);

    if (isForm) {
      onChange({
        target: {
          name,
          value: formattedDate, // Ensure this is a string in "MM-DD-YYYY" format
        },
      });
    } else {
      onChange(formattedDate);
    }
  };

  const handlePrevMonth = (event) => {
    if (disabled) return;
    event.preventDefault();
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = (event) => {
    if (disabled) return;
    event.preventDefault();
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleMonthChange = (event) => {
    if (disabled) return;
    const month = event.target.value;
    setCurrentMonth(new Date(currentMonth.getFullYear(), month, 1));
  };

  const handleYearChange = (event) => {
    if (disabled) return;
    const year = event.target.value;
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
  };

  const handleTodayClick = () => {
    if (disabled) return;
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
    setIsOpen(false);
    if (isForm) {
      onChange({
        target: {
          name,
          value: formatDate(today),
        },
      });
    } else {
      onChange(formatDate(today));
    }
  };

  const handleClearClick = () => {
    if (disabled) return;
    setSelectedDate(null);
    setIsOpen(false);
    if (isForm) {
      onChange({
        target: {
          name,
          value: "",
        },
      });
    } else {
      onChange("");
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    // If date is already a string, parse it first
    if (typeof date === "string") {
      date = parseDateString(date);
    }

    // Check if date is valid
    if (isNaN(date?.getTime())) return "";

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    return `${year}-${month}-${day}`; // YYYY-MM-DD format
  };

  const formatDisplayDate = (date) => {
    if (!date) return "";

    if (typeof date === "string") {
      date = parseDateString(date);
    }

    if (isNaN(date?.getTime())) return "";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Generate years for the dropdown (e.g., last 20 years and next 10 years)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 60; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  // Generate months for the dropdown
  const generateMonths = () => {
    return Array.from({ length: 12 }, (_, i) =>
      new Date(0, i).toLocaleString("default", { month: "long" })
    );
  };

  const handleToggleCalendar = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen || disabled) {
      return;
    }

    const updatePopupPosition = () => {
      const anchorElement = dropdownRef.current;
      if (!anchorElement) {
        return;
      }

      const rect = anchorElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const anchorWidth = rect.width || 320;
      const popupWidth = Math.max(300, Math.min(420, anchorWidth));
      const left = Math.max(8, Math.min(rect.left, viewportWidth - popupWidth - 8));
      setCalendarWidth(popupWidth);

      setPopupStyle({
        position: "fixed",
        top: `${rect.bottom + 8}px`,
        left: `${left}px`,
        width: `${Math.min(popupWidth, viewportWidth - 16)}px`,
        zIndex: 9999999999999,
      });
    };

    updatePopupPosition();
    window.addEventListener("resize", updatePopupPosition);
    window.addEventListener("scroll", updatePopupPosition, true);

    return () => {
      window.removeEventListener("resize", updatePopupPosition);
      window.removeEventListener("scroll", updatePopupPosition, true);
    };
  }, [disabled, isOpen, dropdownRef]);

  const popup = useMemo(() => {
    if (!isOpen || disabled || typeof document === "undefined") {
      return null;
    }

    return createPortal(
      <div
        ref={popupRef}
        className="bg-white text-gray-700 shadow-xl border border-gray-200 rounded-xl p-3"
        style={popupStyle}
      >
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <LeftIcon />
          </button>
          <div className="flex items-center justify-center gap-2">
            <select
              value={currentMonth.getFullYear()}
              onChange={handleYearChange}
              className="px-1.5 py-0.5 text-[11px] font-semibold bg-white border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-primary"
              disabled={disabled}
            >
              {generateYears().map((year) => (
                <option
                  className="px-2 bg-white text-[#707070]"
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              ))}
            </select>
            <select
              value={currentMonth.getMonth()}
              onChange={handleMonthChange}
              className="px-1.5 py-0.5 text-[11px] font-semibold bg-white border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-primary"
              disabled={disabled}
            >
              {generateMonths().map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <RightIcon />
          </button>
        </div>

        <div
          className="grid grid-cols-7 gap-1 text-center"
          style={{ width: `${calendarWidth - 24}px`, maxWidth: "100%" }}
        >
          {daysOfWeek.map((day) => (
            <div key={day} className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide py-0.5">
              {day}
            </div>
          ))}

          {generateCalendarDates().map((date, index) => {
            const isCurrentMonth = date?.getMonth() === currentMonth.getMonth();
            const isSelected =
              selectedDate &&
              date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={`p-1.5 rounded-md text-sm transition-colors ${
                  disabled
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-primary/10 cursor-pointer"
                } ${
                  isCurrentMonth
                    ? isSelected
                      ? "bg-primary text-white"
                      : isToday
                        ? "bg-white text-primary border border-primary"
                        : "text-gray-800"
                    : "text-gray-400"
                }`}
                disabled={disabled}
              >
                {date?.getDate()}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 pt-1.5 border-t border-gray-100 text-xs">
          <button
            onClick={handleTodayClick}
            className={`text-sm hover:underline ${
              disabled
                ? "text-gray-400 cursor-not-allowed"
                : "text-primary hover:text-primary-dark"
            }`}
            disabled={disabled}
          >
            Today
          </button>
          <button
            onClick={handleClearClick}
            className={`text-sm hover:underline ${
              disabled
                ? "text-gray-400 cursor-not-allowed"
                : "text-red-500 hover:text-red-600"
            }`}
            disabled={disabled}
          >
            Clear
          </button>
        </div>
      </div>,
      document.body
    );
  }, [currentMonth, disabled, isOpen, popupStyle, selectedDate, value]);

  return (
    <div
      ref={dropdownRef}
      className={`relative text-xs font-sans ${disabled ? "opacity-90" : ""}`}
    >
      {/* Show the input and label if `label` is provided */}
      {label && (
        <label
          className={`text-sm font-medium ${
            disabled ? "text-gray-400" : "text-primary"
          }`}
        >
          {label}
        </label>
      )}
      {!compact && (
        <div
          onClick={() => {
            handleToggleCalendar();
          }}
          className={`relative ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <input
            name={name}
            value={value ? formatDisplayDate(value) : ""}
            readOnly
            onChange={disabled ? undefined : onChange}
            type="text"
            className={`w-full text-sm bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
            }`}
            disabled={disabled}
          />
          <div
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${
              disabled ? "text-gray-300" : "text-gray-400"
            }`}
          >
            <CalenderIcon />
          </div>
        </div>
      )}
      {error && <span style={{ color: "red" }}>{error}</span>}

      {/* Show calendar standalone if no label is provided */}
      {compact && (
        <div
          className={`flex items-center justify-center text-xs font-light gap-2 ${
            disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
          }`}
          onClick={handleToggleCalendar}
        >
          <CalenderIcon className={disabled ? "opacity-50" : ""} />
          <span
            className={`text-sm ${disabled ? "text-gray-400" : "text-white"}`}
          >
            {selectedDate
              ? `${selectedDate.getDate()} ${selectedDate.toLocaleString(
                  "default",
                  { month: "short" }
                )} ${selectedDate.getFullYear()}`
              : "Select Date"}
          </span>
        </div>
      )}
      {popup}
    </div>
  );
});

export default CustomDatePicker;

CustomDatePicker.displayName = "CustomDatePicker";
