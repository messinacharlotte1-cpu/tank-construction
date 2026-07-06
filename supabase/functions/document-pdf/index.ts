// PDF serveur — Supabase Edge Function (Deno + pdf-lib).
// Génère un PDF depuis une structure de blocs. Déploiement :
//   supabase functions deploy document-pdf --project-ref pegxkhkrveverhoqetyh
// Appelée par le front via supabase.functions.invoke("document-pdf", { body }).
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

type Block =
  | { type: "h"; text: string }
  | { type: "p"; text: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "spacer" };

type Payload = { title: string; subtitle?: string; blocks: Block[] };

const STEEL = rgb(0.106, 0.145, 0.188);
const ORANGE = rgb(0.949, 0.42, 0.114);
const GREY = rgb(0.27, 0.35, 0.42);
const LINE = rgb(0.87, 0.89, 0.91);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = (await req.json()) as Payload;
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    let page = doc.addPage([595, 842]); // A4
    const M = 48;
    let y = 842 - M;

    const ensure = (h: number) => {
      if (y - h < M) { page = doc.addPage([595, 842]); y = 842 - M; }
    };
    const text = (s: string, x: number, size: number, f = font, col = STEEL) => page.drawText(s ?? "", { x, y, size, font: f, color: col });

    // En-tête marque
    page.drawRectangle({ x: M, y: y - 4, width: 46, height: 22, color: ORANGE });
    text("TANK", M + 7, 13, bold, rgb(1, 1, 1));
    text(body.title, M + 60, 16, bold, STEEL);
    y -= 26;
    if (body.subtitle) { text(body.subtitle, M, 10, font, GREY); y -= 16; }
    // Bande hachurée
    page.drawRectangle({ x: M, y: y - 2, width: 595 - 2 * M, height: 4, color: ORANGE });
    y -= 22;

    for (const b of body.blocks) {
      if (b.type === "spacer") { y -= 12; continue; }
      if (b.type === "h") { ensure(24); text(b.text, M, 13, bold, STEEL); y -= 20; continue; }
      if (b.type === "p") { ensure(18); text(b.text, M, 10, font, STEEL); y -= 16; continue; }
      if (b.type === "table") {
        const cols = b.head.length;
        const w = (595 - 2 * M) / cols;
        ensure(22);
        page.drawRectangle({ x: M, y: y - 4, width: 595 - 2 * M, height: 18, color: rgb(0.94, 0.95, 0.96) });
        b.head.forEach((h, i) => text(h, M + 6 + i * w, 9, bold, GREY));
        y -= 20;
        for (const row of b.rows) {
          ensure(18);
          row.forEach((c, i) => text(String(c ?? ""), M + 6 + i * w, 9, font, STEEL));
          page.drawLine({ start: { x: M, y: y - 4 }, end: { x: 595 - M, y: y - 4 }, thickness: 0.5, color: LINE });
          y -= 16;
        }
        y -= 6;
      }
    }

    const bytes = await doc.save();
    return new Response(bytes, { headers: { ...cors, "Content-Type": "application/pdf" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
