import RevealLines from "@/components/ui/RevealLines";

const principles = [
  {
    title: "Context over commands",
    body: "It holds the thread of what is happening, so people never have to restate it.",
  },
  {
    title: "Structure you can see",
    body: "Relationships are drawn in space, not buried in menus and settings.",
  },
  {
    title: "Motion with meaning",
    body: "Every pulse and rotation signals something changing, and nothing moves without a reason.",
  },
];

export default function Dimension() {
  return (
    <section id="dimension" className="section dimension" aria-labelledby="dimension-title">
      <div className="container dimension-grid">
        <div className="dimension-copy">
          <span className="rule" data-rule aria-hidden="true" />
          <RevealLines id="dimension-title" lines={["BEYOND", "WHAT EXISTS."]} className="display h-section" />
          <p className="lede" data-fade>
            Most systems stop at answers. VYTRON is imagined as something larger: an intelligence that holds context,
            notices change, and reshapes itself around the people who use it.
          </p>
          <ul className="principles glass" data-panel>
            {principles.map((p) => (
              <li key={p.title}>
                <h3 className="h-sub">{p.title}</h3>
                <p className="body-copy">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
