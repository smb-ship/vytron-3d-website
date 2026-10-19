"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, Send } from "lucide-react";
import RevealLines from "@/components/ui/RevealLines";
import { siteConfig } from "@/lib/config";

type Fields = { name: string; email: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;
type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "mailto"; href: string }
  | { kind: "unconfigured" }
  | { kind: "error"; text: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v: Fields): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = "Enter your name (at least 2 characters).";
  if (!v.email.trim()) e.email = "Enter your email address.";
  else if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter a valid email address, like name@example.com.";
  if (v.message.trim().length < 10) e.message = "Describe your project in at least 10 characters.";
  return e;
}

export default function Contact() {
  const [values, setValues] = useState<Fields>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    message: useRef<HTMLTextAreaElement>(null),
  };

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const plain = () =>
    `Name: ${values.name.trim()}\nEmail: ${values.email.trim()}\n\n${values.message.trim()}`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setCopied(false);
    const first = (["name", "email", "message"] as const).find((k) => found[k]);
    if (first) {
      refs[first].current?.focus();
      setStatus({ kind: "idle" });
      return;
    }

    if (siteConfig.formEndpoint) {
      setStatus({ kind: "sending" });
      try {
        const res = await fetch(siteConfig.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            name: values.name.trim(),
            email: values.email.trim(),
            message: values.message.trim(),
          }),
        });
        if (res.ok) {
          setStatus({ kind: "sent" });
          setValues({ name: "", email: "", message: "" });
        } else {
          setStatus({ kind: "error", text: `The message service answered with an error (HTTP ${res.status}). Nothing was sent. Please try again.` });
        }
      } catch {
        setStatus({ kind: "error", text: "The message could not be sent because the connection failed. Nothing was sent. Please try again." });
      }
      return;
    }

    if (siteConfig.contactEmail) {
      const subject = encodeURIComponent(`VYTRON enquiry from ${values.name.trim()}`);
      const body = encodeURIComponent(plain());
      const href = `mailto:${siteConfig.contactEmail}?subject=${subject}&body=${body}`;
      setStatus({ kind: "mailto", href });
      window.location.href = href;
      return;
    }

    setStatus({ kind: "unconfigured" });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plain());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const describe = (k: keyof Fields) => (errors[k] ? `${k}-error` : undefined);

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="container contact-grid">
        <div className="contact-intro">
          <RevealLines id="contact-title" lines={["START A", "CONVERSATION."]} className="display h-section" />
          <p className="lede" data-fade>
            Tell us about the project you are imagining. A few honest sentences are enough to begin.
          </p>
          {siteConfig.contactEmail && (
            <p className="body-copy">
              Prefer email?{" "}
              <a className="text-link" href={`mailto:${siteConfig.contactEmail}`}>
                {siteConfig.contactEmail}
              </a>
            </p>
          )}
        </div>

        <form className="contact-form glass" onSubmit={onSubmit} noValidate data-panel>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input
              ref={refs.name}
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={values.name}
              onChange={set("name")}
              aria-invalid={!!errors.name}
              aria-describedby={describe("name")}
              required
            />
            {errors.name && (
              <p id="name-error" className="field-error">
                <AlertCircle size={14} aria-hidden="true" /> {errors.name}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              ref={refs.email}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={values.email}
              onChange={set("email")}
              aria-invalid={!!errors.email}
              aria-describedby={describe("email")}
              required
            />
            {errors.email && (
              <p id="email-error" className="field-error">
                <AlertCircle size={14} aria-hidden="true" /> {errors.email}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="message">Project message</label>
            <textarea
              ref={refs.message}
              id="message"
              name="message"
              rows={5}
              value={values.message}
              onChange={set("message")}
              aria-invalid={!!errors.message}
              aria-describedby={describe("message")}
              required
            />
            {errors.message && (
              <p id="message-error" className="field-error">
                <AlertCircle size={14} aria-hidden="true" /> {errors.message}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={status.kind === "sending"}>
            {status.kind === "sending" ? "Sending…" : "Send message"} <Send size={15} aria-hidden="true" />
          </button>

          <div className="form-status" role="status" aria-live="polite">
            {status.kind === "sent" && (
              <p className="status ok">
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>Message sent. The message service confirmed receipt.</span>
              </p>
            )}
            {status.kind === "mailto" && (
              <p className="status info">
                <Info size={18} aria-hidden="true" />
                <span>
                  Your email app should open with the message ready. Nothing has been sent until you send it there.{" "}
                  <a className="text-link" href={status.href}>
                    Open email again
                  </a>
                </span>
              </p>
            )}
            {status.kind === "unconfigured" && (
              <p className="status warn">
                <Info size={18} aria-hidden="true" />
                <span>
                  Message delivery is not configured on this demo site, so nothing was sent.{" "}
                  <button type="button" className="text-link" onClick={copy}>
                    {copied ? "Copied to clipboard" : "Copy your message"}
                  </button>
                </span>
              </p>
            )}
            {status.kind === "error" && (
              <p className="status err">
                <AlertCircle size={18} aria-hidden="true" />
                <span>{status.text}</span>
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
