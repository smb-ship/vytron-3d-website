import { BrainCircuit, Network, TrendingUp } from "lucide-react";
import RevealLines from "@/components/ui/RevealLines";
import AdaptiveVisual from "./capabilities/AdaptiveVisual";
import ConnectedVisual from "./capabilities/ConnectedVisual";
import PredictiveVisual from "./capabilities/PredictiveVisual";

export default function Capabilities() {
  return (
    <section id="capabilities" className="section capabilities" aria-labelledby="capabilities-title">
      <div className="container">
        <header className="cap-header">
          <RevealLines id="capabilities-title" lines={["THREE WAYS", "OF THINKING."]} className="display h-section" />
          <p className="lede" data-fade>
            Conceptual capabilities for a fictional system. Each one is interactive, so try them.
          </p>
        </header>

        {/* 1 — visual left, text right */}
        <article className="cap cap-adaptive" aria-labelledby="cap-adaptive-title">
          <AdaptiveVisual />
          <div className="cap-text">
            <BrainCircuit className="cap-icon" size={30} strokeWidth={1.4} aria-hidden="true" />
            <h3 className="display h-cap" id="cap-adaptive-title">
              Adaptive
              <br />
              Intelligence
            </h3>
            <p className="lede">Systems that adapt to changing information and evolving needs.</p>
            <p className="body-copy">
              Raise the turbulence and watch the response curve re-tune itself instead of breaking.
            </p>
          </div>
        </article>

        {/* 2 — text left, visual right, staggered down */}
        <article className="cap cap-connected" aria-labelledby="cap-connected-title">
          <div className="cap-text">
            <Network className="cap-icon" size={30} strokeWidth={1.4} aria-hidden="true" />
            <h3 className="display h-cap" id="cap-connected-title">
              Connected
              <br />
              Knowledge
            </h3>
            <p className="lede">Transform disconnected information into meaningful relationships.</p>
            <p className="body-copy">Select fragments to link them. Every new connection creates new relationships.</p>
          </div>
          <ConnectedVisual />
        </article>

        {/* 3 — full-width, headline on top */}
        <article className="cap cap-predictive" aria-labelledby="cap-predictive-title">
          <div className="cap-text cap-text-wide">
            <TrendingUp className="cap-icon" size={30} strokeWidth={1.4} aria-hidden="true" />
            <h3 className="display h-cap" id="cap-predictive-title">
              Predictive Insight
            </h3>
            <p className="lede">Reveal patterns and possibilities through intelligent analysis.</p>
            <p className="body-copy">Extend the horizon and see how certainty gives way to possibility.</p>
          </div>
          <PredictiveVisual />
        </article>
      </div>
    </section>
  );
}
