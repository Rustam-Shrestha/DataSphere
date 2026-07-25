// @ts-nocheck
/**
 * MultiSelectDatePicker — Memoized
 */
import React, { memo, useEffect, useState } from "react";
import {
  CalenderIcon,
  CloseIcon,
  LeftIcon,
  RightIcon,
} from "../../../assets/data/icons";
import { parseDateString } from "../../../helper";
import useClickOutside from "../../../hooks/useClickOutside";

const MultiSelectDatePicker = memo(({
  label = null,
  name = "datePicker",
  value = [],
  isForm = false,
  onChange,
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState(value || []);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const calendarRef = useClickOutside(() => setIsOpen(false));

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  useEffect(() => {
    setSelectedDates(
      value.map((date) => (typeof date === "string" ? parseDateString(date) : date))
    );
  }, [value]);

  // Generate calendar dates
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
    let startDate = new Date(firstDayOfMonth);

    while (startDate.getDay() !== 1) {
      startDate.setDate(startDate.getDate() - 1);
    }

    let endDate = new Date(lastDayOfMonth);
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

  // Handle month navigation
  const handleMonthChange = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    if (direction === "prev") {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
      );
    } else {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
      );
    }
  };

    const handleDateClick = (e, date) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    const updatedDates = selectedDates.some(
      (d) => new Date(d).toDateString() === date.toDateString()
    )
      ? selectedDates.filter(
          (d) => new Date(d).toDateString() !== date.toDateString()
        )
      : [...selectedDates, date];

    setSelectedDates(updatedDates);
    updateParent(updatedDates);
  };

  const handleRemoveDate = (e, dateToRemove) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    const updatedDates = selectedDates.filter(
      (date) => date.toDateString() !== dateToRemove.toDateString()
    );
    setSelectedDates(updatedDates);
    updateParent(updatedDates);
  };

  const updateParent = (dates) => {
    if (isForm) {
      onChange({
        target: { name, value: dates.map(formatDate) },
      });
    } else {
      onChange(dates.map(formatDate));
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    if (typeof date === "string") date = parseDateString(date);
    return `${date.getFullYear()}-${(date.getMonth() + 1)
      ?.toString()
      ?.padStart(2, "0")}-${date.getDate()?.toString()?.padStart(2, "0")}`;
  };

  const formatDateForDisplay = (date) => {
    if (!date) return "";
    if (typeof date === "string") date = parseDateString(date);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="relative text-sm font-sans" ref={calendarRef}>
      {label && (
        <label className="block text-sm  text-primary mb-1">{label}</label>
      )}

      {/* Input Field */}
      <div className="relative">
        <input
          name={name}
          value={selectedDates.map(formatDate).join(", ")}
          readOnly
          type="text"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full text-sm bg-white text-gray-600 border ${
            error ? "border-red-500" : "border-gray-300"
          } rounded-md shadow-sm pl-3 pr-10 py-2.5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary`}
          placeholder="Select dates..."
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <CalenderIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Calendar */}
      {isOpen && (
        <div className="absolute mt-1 w-full max-w-2xl bg-white shadow-lg rounded-lg overflow-hidden z-[2147483647] border border-gray-200">
          <div className="flex flex-col md:flex-row">
            {/* Left: Calendar - 50% width */}
            <div className="w-full md:w-2/3 p-4">
              {/* Header with navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={(e) => handleMonthChange(e, "prev")}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                >
                  <LeftIcon className="h-4 w-4" />
                </button>
                <div className="text-sm font-semibold text-gray-800">
                  {currentMonth.toLocaleString("default", { month: "long" })}{" "}
                  {currentMonth.getFullYear()}
                </div>
                <button
                  onClick={(e) => handleMonthChange(e, "next")}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                >
                  <RightIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-gray-500 py-2"
                  >
                    {day}
                  </div>
                ))}

                {generateCalendarDates().map((date, index) => {
                  const isCurrentMonth =
                    date.getMonth() === currentMonth.getMonth();
                  const isSelected = selectedDates.some(
                    (d) => d.toDateString() === date.toDateString()
                  );
                  const isToday =
                    new Date().toDateString() === date.toDateString();

                  return (
                    <button
                      key={index}
                      onClick={(e) => handleDateClick(e, date)}
                      className={`h-8 w-full rounded-full flex items-center justify-center text-sm
                        ${
                          isCurrentMonth && !isSelected
                            ? "text-gray-900"
                            : "text-gray-400"
                        }
                        ${isSelected ? "bg-primary text-white" : ""}
                        ${isToday && !isSelected ? "border border-primary" : ""}
                        ${disabled ? "cursor-default" : "hover:bg-primary hover:bg-opacity-20 transition-colors"}`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Dates List - 50% width */}
            <div className="w-full md:w-1/2 bg-gray-50 p-4 border-t md:border-t-0 md:border-l border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Selected Dates
                </h3>
                <span className="text-xs bg-primary text-white rounded-full px-2 py-1">
                  {selectedDates.length}
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {selectedDates.length > 0 ? (
                  selectedDates
                    .sort((a, b) => a - b)
                    .map((date, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 hover:border-primary transition-colors"
                      >
                        <span className="text-sm text-gray-700">
                          {formatDateForDisplay(date)}
                        </span>
                        {!disabled && (
                          <button
                            onClick={(e) => handleRemoveDate(e, date)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <CloseIcon className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No dates selected</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});

export default MultiSelectDatePicker;
