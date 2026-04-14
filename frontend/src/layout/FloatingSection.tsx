import Container from "./Container";
import "./FloatingSection.css";

interface FloatingSectionProps {
  children: React.ReactNode;
  onBackgroundClick?: () => void;
  wide?: boolean;
}

function FloatingSection({
  children,
  onBackgroundClick,
  wide,
}: FloatingSectionProps) {
  return (
    <div className={`floating-section ${wide ? "floating-section-wide" : ""}`}>
      <div
        className="floating-section-background"
        onClick={onBackgroundClick}
      />
      <section>
        <Container>{children}</Container>
      </section>
    </div>
  );
}

export default FloatingSection;
