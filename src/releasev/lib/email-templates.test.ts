import { describe, expect, it } from "vitest";
import { contactNotificationEmail, escapeHtml, orderConfirmationEmail, reviewRequestEmail } from "./email-templates";

describe("escapeHtml", () => {
  it("maakt HTML-tekens onschadelijk", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;",
    );
  });
});

describe("orderConfirmationEmail", () => {
  it("noemt bedrag, referentie en de QR-kaart, en begroet met voornaam", () => {
    const mail = orderConfirmationEmail({ customerName: "Sanne de Vries", amountLabel: "€ 69", orderReference: "cs_test_123", isGift: false });
    expect(mail.text).toContain("Hoi Sanne,");
    expect(mail.text).toContain("€ 69");
    expect(mail.text).toContain("cs_test_123");
    expect(mail.text).toContain("QR-code");
    expect(mail.text).not.toContain("cadeau");
  });

  it("vermeldt de cadeauverpakking als het een cadeau is", () => {
    const mail = orderConfirmationEmail({ customerName: null, amountLabel: "€ 69", orderReference: "x", isGift: true });
    expect(mail.text).toContain("Hoi,");
    expect(mail.text).toContain("cadeau");
  });
});

describe("contactNotificationEmail", () => {
  it("escapet invoer van bezoekers in de HTML", () => {
    const mail = contactNotificationEmail({ name: "<b>Eve</b>", email: "e@x.nl", subject: "retour", message: "<img src=x onerror=alert(1)>" });
    expect(mail.html).not.toContain("<img src=x");
    expect(mail.html).toContain("&lt;img src=x");
  });
});

describe("reviewRequestEmail", () => {
  it("vraagt om een eerlijke ervaring zonder iets te beloven", () => {
    const mail = reviewRequestEmail({ customerName: "Ali" });
    expect(mail.text).toContain("Hoi Ali,");
    expect(mail.text).toContain("eerlijke ervaring");
  });
});
