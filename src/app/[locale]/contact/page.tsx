"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default function ContactPage() {
  const params = useParams<{ locale: string }>();
  const locale = (isValidLocale(params.locale) ? params.locale : "en") as Locale;
  const dict = getDictionary(locale);

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const successRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  // Focus the success/error message when status changes for screen readers
  useEffect(() => {
    if (status === "sent") successRef.current?.focus();
    if (status === "error") errorRef.current?.focus();
  }, [status]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          subject: form.get("subject"),
          message: form.get("message"),
        }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        ref={successRef}
        className="mx-auto max-w-xl px-4 py-16 text-center"
        role="status"
        aria-live="polite"
        tabIndex={-1}
      >
        <h1 className="text-2xl font-bold text-green-600 mb-2">
          {dict.contact.success}
        </h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{dict.contact.title}</h1>
      <p className="text-gray-600 mb-6">{dict.contact.description}</p>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            {dict.contact.name}
          </label>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-spark-blue focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            {dict.contact.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-spark-blue focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-1">
            {dict.contact.subject}
          </label>
          <input
            id="subject"
            name="subject"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-spark-blue focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            {dict.contact.message}
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-spark-blue focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="bg-spark-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-spark-blue-dark disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-spark-blue focus:ring-offset-2"
        >
          {status === "sending" ? dict.contact.sending : dict.contact.submit}
        </button>
        {status === "error" && (
          <p
            ref={errorRef}
            className="text-red-600 text-sm"
            role="alert"
            tabIndex={-1}
          >
            {dict.contact.error}
          </p>
        )}
      </form>
    </div>
  );
}
