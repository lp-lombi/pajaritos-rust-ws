import "./StatusBar.css";

type StatusType = "info" | "error";

type StatusBarProps = {
    message?: string;
    type?: StatusType;
};

function StatusBar({ message, type }: StatusBarProps) {
    const statusClassName = type === "error" ? "status-bar-message is-error" : "status-bar-message is-info";

    return (
        <footer className="status-bar" role="status" aria-live="polite" aria-atomic="true">
            {message ? <p className={statusClassName}>Resp: {message}</p> : null}
        </footer>
    );
}

export default StatusBar;
