// @ts-nocheck
/**
 * CustomTimePicker — Memoized
 */
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ClockIcon } from "../../../assets/data/icons";
import useClickOutside from "../../../hooks/useClickOutside";

const CustomTimePicker = memo(({
  label = null,
  name = "timePicker",
  value,
  onChange,
  isForm = false,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef(null);
  const dropdownRef = useClickOutside(() => setIsOpen(false), [popupRef]);
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPeriod, setSelectedPeriod] = useState("AM");
  const [popupStyle, setPopupStyle] = useState({});

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const periods = ["AM", "PM"];

  const handleSelection = (event) => {
    event.preventDefault(); // Prevent default form submission or URL change
    const time = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    // if (onChange) onChange(time);
    if (isForm) {
      onChange({
        target: {
          name,
          value: time,
        },
      });
    } else {
      onChange(time);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePopupPosition = () => {
      const anchorElement = dropdownRef.current;
      if (!anchorElement) {
        return;
      }

      const rect = anchorElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const popupWidth = 256;
      const left = Math.max(8, Math.min(rect.left, viewportWidth - popupWidth - 8));

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
  }, [isOpen, dropdownRef]);

  const popup = useMemo(() => {
    if (!isOpen || typeof document === "undefined") {
      return null;
    }

    return createPortal(
      <div
        ref={popupRef}
        className="bg-white text-[#707070] shadow-lg border rounded-md py-4 px-4"
        style={popupStyle}
      >
        <div className="flex justify-between items-center text-sm">
          <div className="flex-1 text-center overflow-auto h-40 scrollbar-hidden">
            {hours.map((hour) => (
              <button
                key={hour}
                onClick={(event) => {
                  event.preventDefault();
                  setSelectedHour(hour);
                }}
                className={`block w-full py-2 rounded-md hover:bg-green-100 ${
                  selectedHour === hour
                    ? "bg-[#E7F1E8] text-primary"
                    : "text-gray-800"
                }`}
              >
                {hour}
              </button>
            ))}
          </div>
          <div className="flex-1 text-center overflow-auto h-40 scrollbar-hidden">
            {minutes.map((minute) => (
              <button
                key={minute}
                onClick={(event) => {
                  event.preventDefault();
                  setSelectedMinute(minute);
                }}
                className={`block w-full py-2 rounded-md hover:bg-green-100 ${
                  selectedMinute === minute
                    ? "bg-[#E7F1E8] text-primary"
                    : "text-gray-800"
                }`}
              >
                {minute}
              </button>
            ))}
          </div>
          <div className="flex-1 text-center">
            {periods.map((period) => (
              <button
                key={period}
                onClick={(event) => {
                  event.preventDefault();
                  setSelectedPeriod(period);
                }}
                className={`block w-full py-2 rounded-md hover:bg-green-100 ${
                  selectedPeriod === period
                    ? "bg-[#E7F1E8] text-primary"
                    : "text-gray-800"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setIsOpen(false)}
            className="text-primary font-medium hover:font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleSelection}
            className="text-primary font-medium hover:font-bold"
          >
            Confirm
          </button>
        </div>
      </div>,
      document.body
    );
  }, [hours, isOpen, minutes, periods, popupStyle, selectedHour, selectedMinute, selectedPeriod]);

  return (
    <div className="relative text-xs font-sans" ref={dropdownRef}>
      {label && (
        <label className="text-sm font-medium text-primary">{label}</label>
      )}
      <div className="relative">
        <input
          name={name}
          value={value || `${selectedHour}:${selectedMinute} ${selectedPeriod}`}
          readOnly
          onClick={() => setIsOpen(!isOpen)}
          type="text"
          className={`cursor-pointer w-full text-sm bg-[#F6F6F6] text-gray-500 px-3 py-2.5 rounded appearance-none focus:outline-none focus:ring-2 focus:ring-primary`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          <ClockIcon />
        </div>
      </div>
      {error && <span style={{ color: "red" }}>{error}</span>}

      {popup}
    </div>
  );
});

export default CustomTimePicker;
