// @ts-nocheck
import { memo, useRef } from "react";

// Enhanced ToolbarButton Component
const ToolbarButton = memo(({ icon, onClick, isActive, tooltip }) => (
  <button
    onClick={(e) => {
      e.preventDefault(); // Prevent default button behavior
      onClick(); // Execute the passed onClick handler
    }}
    className={`group text-sm relative flex items-center justify-center p-2 rounded-md shadow-md border ${
      isActive
        ? "bg-green-500 text-white border-green-500"
        : "bg-gray-100 text-gray-600 border-gray-300"
    } hover:bg-green-100 hover:text-green-700 transition-all duration-200`}
    aria-label={tooltip}
  >
    {icon}
    {/* Tooltip */}
    <span className="absolute bottom-full mb-2 w-max px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {tooltip}
    </span>
  </button>
));

const RichTextEditor = memo(({ id, label, value, onChange, error }) => {
  const editorRef = useRef(null);

  const handleCommand = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const handleContentChange = () => {
    const content = editorRef.current.innerHTML;
    onChange(content); // Pass content back to parent
  };

  const toolbarButtons = [
    { command: "bold", icon: <b>B</b>, tooltip: "Bold" },
    { command: "italic", icon: <i>I</i>, tooltip: "Italic" },
    { command: "underline", icon: <u>U</u>, tooltip: "Underline" },
    { command: "strikeThrough", icon: <s>S</s>, tooltip: "Strikethrough" },
    { command: "insertUnorderedList", icon: "• List", tooltip: "Bullet List" },
    { command: "insertOrderedList", icon: "1. List", tooltip: "Numbered List" },
    {
      command: "formatBlock",
      value: "H1",
      icon: <span>H1</span>,
      tooltip: "Heading 1",
    },
    {
      command: "formatBlock",
      value: "H2",
      icon: <span>H2</span>,
      tooltip: "Heading 2",
    },
    {
      command: "formatBlock",
      value: "H3",
      icon: <span>H3</span>,
      tooltip: "Heading 3",
    },
    { command: "undo", icon: "⤺", tooltip: "Undo" },
    { command: "redo", icon: "⤻", tooltip: "Redo" },
  ];

  return (
    <div className="flex flex-col">
      {/* Label */}
      {label && (
        <label htmlFor={id} className="text-sm font-medium mb-2 text-primary">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Toolbar */}
        <div className="flex gap-3 mb-4 bg-gray-100 p-2 rounded-lg shadow-inner border border-gray-200">
          {toolbarButtons.map((button, index) => (
            <ToolbarButton
              key={index}
              icon={button.icon}
              isActive={document.queryCommandState(button.command)}
              tooltip={button.tooltip}
              onClick={() =>
                handleCommand(button.command, button.value || undefined)
              }
            />
          ))}
        </div>

        {/* Editable Content Area */}
        <div
          id={id}
          ref={editorRef}
          contentEditable
          className={`border rounded-lg p-4 text-sm bg-white text-gray-800 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-primary ${
            error ? "border-red-500" : "border-gray-300"
          } shadow-sm`}
          onInput={handleContentChange}
          dangerouslySetInnerHTML={{ __html: value }}
        ></div>

        {/* Error Message */}
        {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
      </div>
    </div>
  );
});

export default RichTextEditor;
