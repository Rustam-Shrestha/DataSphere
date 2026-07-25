// @ts-nocheck
/**
 * PopMessage — Imperative toast notification utility
 *
 * Static class for showing ephemeral success/error messages.
 * Uses ReactDOM.createRoot to render outside the React tree, so it works
 * from anywhere (event handlers, services, non-component code).
 *
 * Usage:
 *   PopMessage.success("Record saved!");
 *   PopMessage.error("Something went wrong.");
 *   PopMessage.warning("This is a warning.");
 */
import ReactDOM from "react-dom/client";

// ── Extracted icon components (keeps createMessage readable) ──

const SuccessIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6 text-white"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m4.5 12.75 6 6 9-13.5"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6 text-white"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
    />
  </svg>
);

const WarningIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6 text-white"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
    />
  </svg>
);

// ── Toast container rendered imperatively via portal ──

const Toast = ({ text, type }) => (
  <div
    className={`fixed z-[9999999999999] flex items-center bottom-5 left-1/2 transform -translate-x-1/2 p-4 rounded-lg shadow-lg text-sm font-semibold pop-message
      ${type === "success" ? "bg-primary text-white" : type === "error" ? "bg-danger-600 text-white" : "bg-yellow-500 text-white"}
    `}
  >
    <span className="mr-2">
      {type === "success" ? <SuccessIcon /> : type === "error" ? <ErrorIcon /> : <WarningIcon />}
    </span>
    {text}
  </div>
);

class PopMessage {
  /** Auto-dismiss duration in ms */
  static fadeTime = 3000;

  /** Show a green success toast */
  static success(text) {
    this.createMessage(text, "success");
  }

  /** Show a red error toast */
  static error(text) {
    this.createMessage(text, "error");
  }

  /** Show a yellow warning toast */
  static warning(text) {
    this.createMessage(text, "warning");
  }

  /**
   * Imperatively mount a Toast into a temporary DOM node, then clean up
   * after `fadeTime` ms. Each call creates an independent root so
   * multiple toasts can stack.
   */
  static createMessage(text, type) {
    const messageId = `pop-message-${Date.now()}`;
    const messageContainer = document.createElement("div");
    messageContainer.id = messageId;
    messageContainer.style.position = "fixed";
    messageContainer.style.inset = "0";
    messageContainer.style.zIndex = "9999999999";
    messageContainer.style.pointerEvents = "none";
    document.body.appendChild(messageContainer);

    const root = ReactDOM.createRoot(messageContainer);
    root.render(<Toast text={text} type={type} />);

    setTimeout(() => {
      root.unmount();
      messageContainer.remove();
    }, this.fadeTime);
  }
}

export default PopMessage;
