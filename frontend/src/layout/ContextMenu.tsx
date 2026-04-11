import "./ContextMenu.css";
import { useEffect, useRef } from "react";

interface ContextMenuOption {
    label: string;
    onClick: () => void;
}

interface ContextMenuProps {
    options: ContextMenuOption[];
    isOpen: boolean;
    onClose?: () => void;
}

function ContextMenu({
    options,
    isOpen,
    onClose,
} : ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose?.();
            }
        }

        if (!isOpen) {
            return;
        }

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

  return (
    <div
        ref={menuRef}
        className='context-menu'
    >
        {options.map((option, index) => (
            <button
                key={index}
                className='context-menu-option'
                type="button"
                onClick={() => {
                    option.onClick();
                    onClose?.();
                }}
            >
                {option.label}
            </button>
        ))}
    </div>
  )
}

export default ContextMenu