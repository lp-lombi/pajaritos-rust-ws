import Container from "./Container";
import "./FloatingSection.css"

interface FloatingSectionProps {
    children: React.ReactNode;
    onBackgroundClick?: () => void;
}

function FloatingSection({ children, onBackgroundClick }: FloatingSectionProps) {
  return (
      <div className="floating-section">
          <div className="floating-section-background" onClick={onBackgroundClick} />
          <section>
              <Container>{children}</Container>
          </section>
      </div>
  );
}

export default FloatingSection