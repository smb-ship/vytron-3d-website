import { ArrowRight } from "lucide-react";
import RevealLines from "@/components/ui/RevealLines";
import SectionLink from "@/components/ui/SectionLink";

export default function FinalCta() {
  return (
    <section id="cta" className="section final-cta" aria-labelledby="cta-title">
      <div className="container final-inner">
        <RevealLines
          id="cta-title"
          lines={["THE NEXT DIMENSION", "STARTS HERE."]}
          className="display h-section h-final"
        />
        <p className="lede" data-fade>
          Explore a different way to think about intelligent experiences.
        </p>
        <SectionLink to="contact" className="btn btn-primary btn-lg">
          Start a conversation <ArrowRight size={16} aria-hidden="true" />
        </SectionLink>
      </div>
    </section>
  );
}
