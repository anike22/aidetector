import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { renderEmailTemplate } from "./renderEmailTemplate.ts";

const settings = {
  company_name: "AIDetector.cx",
  website_url: "https://aidetector.cx",
  logo_url: "https://miaoda-conversation-file.s3cdn.medo.dev/user-c18kzohmrlkw/app-c18l1vf2nz7l/20260831/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png",
  primary_color: "#4f46e5",
  accent_color: "#818cf8",
  business_email: "hello@aidetector.cx",
  business_phone: "+1 555 123 4567",
  sender_display_name: "Anike Tobechukwu Sunday",
  business_address: "123 Innovation Drive",
};

Deno.test("body-only template renders dark navy header and separate AIDetector.cx text", () => {
  const result = renderEmailTemplate({
    template: { body_only: true, html_body: "<p>Hello {{first_name}},</p>" },
    subject: "Partnership",
    preheader: "Let's collaborate",
    recipientData: { first_name: "Alex", email: "alex@example.com" },
    settings,
  });
  assertEquals(result.validation.ok, true);
  assertStringIncludes(result.html, "Hello Alex");
  assertStringIncludes(result.html, "AIDetector");
  assertStringIncludes(result.html, ".cx");
  assertStringIncludes(result.html, "#0f172a"); // Dark navy header
  assertStringIncludes(result.html, "AI content intelligence for trusted publishing");
  assertStringIncludes(result.html, "Partnerships &amp; Integrations");
  assertStringIncludes(result.html, "mailto:hello@aidetector.cx");
  assertStringIncludes(result.html, "tel:+15551234567");
  assertStringIncludes(result.html, "Anike Tobechukwu Sunday");
  assertStringIncludes(result.html, "Founder, AIDetector.cx");
});

Deno.test("CTA button renders visible white text with specified label and url", () => {
  const result = renderEmailTemplate({
    template: { body_only: true, html_body: "<p>Check our new tool</p>" },
    subject: "SEO Assistant Launch",
    cta: { label: "View the SEO Assistant", url: "https://aidetector.cx/seo-assistant" },
    settings,
  });

  assertEquals(result.validation.ok, true);
  // Anchor must contain the actual escaped CTA label as visible text
  assertStringIncludes(result.html, "View the SEO Assistant");
  assertStringIncludes(result.html, "https://aidetector.cx/seo-assistant");
  // Inline styles directly on anchor
  assertStringIncludes(result.html, "color:#ffffff !important");
  assertStringIncludes(result.html, "font-family:Arial,Helvetica,sans-serif");
  assertStringIncludes(result.html, "font-size:14px");
  assertStringIncludes(result.html, "font-weight:700");
  assertStringIncludes(result.html, "line-height:20px");
  assertStringIncludes(result.html, "display:inline-block");
  assertStringIncludes(result.html, '<a href="https://aidetector.cx/seo-assistant" target="_blank" class="email-cta-link"');
});

Deno.test("empty CTA fields produce no button", () => {
  const result = renderEmailTemplate({
    template: { body_only: true, html_body: "<p>Simple announcement</p>" },
    subject: "Announcement",
    cta: { label: "", url: "" },
    settings,
  });

  assertEquals(result.html.includes('<a href="" target="_blank" class="email-cta-link"'), false);
  assertEquals(result.html.includes('class="email-cta-link">'), false);
  assertEquals(result.validation.warnings.length, 0);
});

Deno.test("incomplete CTA produces warning and does not render empty button", () => {
  // Label provided, no URL
  const resultLabelOnly = renderEmailTemplate({
    template: { body_only: true, html_body: "<p>Announcement</p>" },
    subject: "Announcement",
    cta: { label: "Click here", url: "" },
    settings,
  });
  assertEquals(resultLabelOnly.html.includes('class="email-cta-link">'), false);
  assertEquals(resultLabelOnly.html.includes("Click here"), false);
  assertStringIncludes(resultLabelOnly.validation.warnings.join(" "), "CTA button label was provided without a destination URL");

  // URL provided, no Label
  const resultUrlOnly = renderEmailTemplate({
    template: { body_only: true, html_body: "<p>Announcement</p>" },
    subject: "Announcement",
    cta: { label: "", url: "https://aidetector.cx" },
    settings,
  });
  assertEquals(resultUrlOnly.html.includes('class="email-cta-link">'), false);
  assertEquals(resultUrlOnly.html.includes("https://aidetector.cx"), true); // in settings footer, but not in cta button
  assertStringIncludes(resultUrlOnly.validation.warnings.join(" "), "CTA button URL was provided without a button label");
});

Deno.test("custom HTML mode is not wrapped", () => {
  const result = renderEmailTemplate({
    template: { body_only: false },
    subject: "Plain",
    bodyHtml: "<p>Simple body</p>",
    settings,
  });
  assertEquals(result.html, "<p>Simple body</p>");
  assertStringIncludes(result.text, "Simple body");
});

Deno.test("missing first_name uses fallback", () => {
  const result = renderEmailTemplate({
    template: { body_only: true, html_body: "<p>Dear {{first_name}},</p>" },
    subject: "Hi",
    settings,
  });
  assertStringIncludes(result.html, "Dear there,");
});

Deno.test("unsafe tags are stripped but safe formatting is kept", () => {
  const result = renderEmailTemplate({
    template: { body_only: true, html_body: "<p>Hi</p><script>alert('x')</script><a href='javascript:alert(1)'>link</a>" },
    subject: "Safety",
    settings,
  });
  assertEquals(result.html.includes("<script>"), false);
  assertEquals(result.html.includes("javascript:"), false);
  assertStringIncludes(result.html, "<p>Hi</p>");
});

Deno.test("unresolved merge tags are reported in validation", () => {
  const result = renderEmailTemplate({
    template: { body_only: true, html_body: "<p>Hi {{first_name}},</p>" },
    subject: "Greeting {{unknown_tag}}",
    settings,
  });
  assertStringIncludes(result.validation.warnings.join(" "), "{{unknown_tag}}");
});

Deno.test("campaign includes unsubscribe link while direct email does not", () => {
  const campaign = renderEmailTemplate({
    template: { body_only: true, html_body: "<p>News</p>" },
    subject: "News",
    isCampaign: true,
    unsubscribeUrl: "https://aidetector.cx/unsubscribe?email=test@example.com",
    settings,
  });
  assertStringIncludes(campaign.html, "Unsubscribe");

  const direct = renderEmailTemplate({
    template: { body_only: true, html_body: "<p>Direct</p>" },
    subject: "Direct",
    isCampaign: false,
    settings,
  });
  assertEquals(direct.html.includes("Unsubscribe"), false);
});
