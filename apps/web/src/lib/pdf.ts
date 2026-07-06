import { supabase } from "./supabase";

// ── PDF SERVEUR (Supabase Edge Function `document-pdf`, Deno + pdf-lib) ──
export type PdfBlock =
  | { type: "h"; text: string }
  | { type: "p"; text: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "spacer" };
export type PdfPayload = { title: string; subtitle?: string; blocks: PdfBlock[] };

export async function serverPdf(filename: string, payload: PdfPayload) {
  const { data, error } = await supabase.functions.invoke("document-pdf", { body: payload });
  if (error) {
    alert("PDF serveur indisponible (fonction non déployée ?).\n" + error.message);
    return;
  }
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename + ".pdf";
  a.click();
  URL.revokeObjectURL(url);
}

// Génération PDF côté navigateur (impression → "Enregistrer en PDF"). Fallback hors-ligne.
export function printDocument(title: string, bodyHtml: string) {
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) {
    alert("Autorisez les pop-ups pour générer le PDF.");
    return;
  }
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"/><title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet"/>
    <style>
      *{box-sizing:border-box} body{font-family:'Barlow',sans-serif;color:#1B2530;margin:0;padding:40px}
      h1,h2,h3{font-family:'Barlow Condensed',sans-serif;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px}
      .bar{height:6px;background:repeating-linear-gradient(45deg,#F26B1D 0 10px,#1B2530 10px 20px);margin:14px 0}
      table{width:100%;border-collapse:collapse;font-size:13px;margin-top:10px}
      th,td{padding:7px 9px;border-bottom:1px solid #DDE3E9;text-align:left}
      th{background:#F0F2F4;color:#46586B}
      .tot{text-align:right} .right{text-align:right}
      .muted{color:#46586B;font-size:12px}
      .banner{background:#FCF3DB;border:1px solid #E9A100;color:#8a6d00;padding:10px 12px;border-radius:8px;font-size:12px;margin:12px 0}
      .brand{display:flex;align-items:center;gap:10px} .logo{background:#F26B1D;color:#fff;padding:6px 10px;border-radius:8px;font-family:'Barlow Condensed';font-weight:700}
      @media print{body{padding:0}}
    </style></head><body>${bodyHtml}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

export const fcfaP = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ") + " FCFA";
