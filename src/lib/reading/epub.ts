import JSZip from "jszip";
import { buildBook, type Book } from "@/lib/reading/model";

const MAX_BYTES = 32 * 1024 * 1024;

function findFile(zip: JSZip, path: string) {
  const direct = zip.file(path);
  if (direct && !direct.dir) return direct;
  const lower = decodeURIComponent(path).toLowerCase();
  const hit = Object.keys(zip.files).find(
    (key) => !zip.files[key].dir && key.toLowerCase() === lower,
  );
  return hit ? zip.file(hit) : null;
}

function resolveZipPath(base: string, href: string) {
  const raw = href.split("#")[0] ?? href;
  const combined = raw.startsWith("/") ? raw.slice(1) : `${base}${raw}`;
  const parts = combined.split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(decodeURIComponent(part));
  }
  return out.join("/");
}

function cleanText(value: string) {
  return value.replace(/\u00ad/g, "").replace(/\s+/g, " ").trim();
}

function chapterFromXhtml(xhtml: string, fallbackTitle: string) {
  const doc = new DOMParser().parseFromString(xhtml, "application/xhtml+xml");
  const root = doc.querySelector("parsererror")
    ? new DOMParser().parseFromString(xhtml, "text/html")
    : doc;
  const nodes = [...root.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,blockquote")].filter((el) => {
    return !el.closest("nav, script, style, svg");
  });
  let title = "";
  const blocks: { kind: "heading" | "paragraph"; text: string }[] = [];
  for (const el of nodes) {
    const text = cleanText(el.textContent ?? "");
    if (!text) continue;
    const tag = el.tagName.toLowerCase();
    if (tag === "h1" && !title) {
      title = text;
      continue;
    }
    if (/^h[1-6]$/.test(tag)) blocks.push({ kind: "heading", text });
    else blocks.push({ kind: "paragraph", text });
  }
  if (!blocks.length) {
    const plain = cleanText(root.body?.textContent ?? "");
    if (plain) blocks.push({ kind: "paragraph", text: plain });
  }
  return { title: title || fallbackTitle, blocks };
}

export async function parseEpub(buffer: ArrayBuffer, filename: string): Promise<Book> {
  if (buffer.byteLength > MAX_BYTES) {
    throw new Error("That file is over 32 MB.");
  }
  if (typeof DOMParser === "undefined") {
    throw new Error("Open this book in the browser.");
  }
  const zip = await JSZip.loadAsync(buffer);
  const container = await findFile(zip, "META-INF/container.xml")?.async("string");
  const opfPath = container?.match(/full-path="([^"]+)"/)?.[1];
  if (!opfPath) throw new Error("This epub has no package file.");
  const opfXml = await findFile(zip, opfPath)?.async("string");
  if (!opfXml) throw new Error("This epub is missing its spine.");
  const opf = new DOMParser().parseFromString(opfXml, "application/xml");
  const title = cleanText(opf.querySelector("title")?.textContent ?? "") || filename.replace(/\.epub$/i, "");
  const author = cleanText(opf.querySelector("creator")?.textContent ?? "") || "Unknown";
  const manifest = new Map<string, Element>();
  opf.querySelectorAll("manifest > item").forEach((item) => {
    const id = item.getAttribute("id");
    if (id) manifest.set(id, item);
  });
  const base = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
  const chapters: { title: string; blocks: { kind: "heading" | "paragraph"; text: string }[] }[] = [];
  let section = 0;
  for (const ref of opf.querySelectorAll("spine > itemref")) {
    const id = ref.getAttribute("idref") ?? "";
    const item = manifest.get(id);
    if (!item) continue;
    const properties = item.getAttribute("properties") ?? "";
    if (properties.split(/\s+/).includes("nav")) continue;
    const media = item.getAttribute("media-type") ?? "";
    if (media && !media.includes("html")) continue;
    const href = item.getAttribute("href");
    if (!href) continue;
    const path = resolveZipPath(base, href);
    const file = findFile(zip, path);
    if (!file) continue;
    section += 1;
    const xhtml = await file.async("string");
    const chapter = chapterFromXhtml(xhtml, `Section ${section}`);
    if (chapter.blocks.length) chapters.push(chapter);
  }
  if (!chapters.length) throw new Error("This epub has no readable text.");
  return buildBook({
    id: `epub-${crypto.randomUUID()}`,
    title,
    author,
    source: "import",
    chapters,
  });
}
