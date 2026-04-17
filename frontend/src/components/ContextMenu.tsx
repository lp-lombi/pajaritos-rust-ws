import "./ContextMenu.css";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ContextMenuOption {
  label: string;
  onClick: () => void;
}

interface ContextMenuProps {
  options: ContextMenuOption[];
  isOpen: boolean;
  anchorElement?: HTMLElement | null;
  onClose?: () => void;
}

function ContextMenu({
  options,
  isOpen,
  anchorElement,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isPositionReady, setIsPositionReady] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    function handleOutsidePointerDown(event: MouseEvent) {
      const targetNode = event.target as Node;

      if (menuRef.current?.contains(targetNode)) {
        return;
      }

      if (anchorElement?.contains(targetNode)) {
        return;
      }

      onClose?.();
    }

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleOutsidePointerDown);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleOutsidePointerDown);
    };
  }, [isOpen, onClose, anchorElement]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setIsPositionReady(false);
      return;
    }

    function updatePosition() {
      const menuElement = menuRef.current;

      if (!anchorElement || !menuElement) {
        return;
      }

      const anchorRect = anchorElement.getBoundingClientRect();
      const menuRect = menuElement.getBoundingClientRect();
      const viewportPadding = 8;

      let left = anchorRect.right - menuRect.width;
      if (left < viewportPadding) {
        left = viewportPadding;
      }
      if (left + menuRect.width > window.innerWidth - viewportPadding) {
        left = window.innerWidth - menuRect.width - viewportPadding;
      }

      let top = anchorRect.bottom + 8;
      if (top + menuRect.height > window.innerHeight - viewportPadding) {
        top = Math.max(viewportPadding, anchorRect.top - menuRect.height - 8);
      }

      menuElement.style.top = `${top}px`;
      menuElement.style.left = `${left}px`;
      setIsPositionReady(true);
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, anchorElement]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      className={`context-menu ${isPositionReady ? "is-ready" : ""}`}
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
    >
      {options.map((option, index) => (
        <button
          key={index}
          className="context-menu-option"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose?.();
            option.onClick();
          }}
        >
          {option.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}

export default ContextMenu;
