import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

type Canal = "X" | "LinkedIn" | "Ambos";
type EstadoBorrador = "pendiente_redacción" | "borrador_en_obsidian" | "revisado_por_kike";

interface NewsItem {
  id: string;
  titulo: string;
  fuente: string;
  fecha: string;
  resumen: string;
  temas: string[];
  categoria: string;
  url?: string;
  marcadoPara?: Canal;
  descartada?: boolean;
}

interface DraftEntry {
  id: string;
  newsId: string;
  tituloNoticia: string;
  canal: "X" | "LinkedIn";
  estado: EstadoBorrador;
  obsidianRef: string;
}

interface StoreData {
  news: NewsItem[];
  drafts: DraftEntry[];
  lastSync?: string;
}

const FEEDS: Array<{ categoria: string; fuente: string; url: string; temas: string[] }> = [
  { categoria: "IA-LLMs", fuente: "OpenAI News", url: "https://openai.com/news/rss.xml", temas: ["LLMs", "IA"] },
  { categoria: "IA-LLMs", fuente: "DeepMind Blog", url: "https://deepmind.google/discover/rss/", temas: ["IA", "Agentes"] },
  { categoria: "IA-LLMs", fuente: "MIT AI News", url: "http://news.mit.edu/rss/topic/artificial-intelligence", temas: ["IA", "LLMs"] },
  { categoria: "IA-LLMs", fuente: "NVIDIA AI Blog", url: "https://blogs.nvidia.com/feed/", temas: ["IA", "Infra"] },
  { categoria: "IA-LLMs", fuente: "Just AI News", url: "https://justainews.com/feed", temas: ["IA", "Negocio"] },
  { categoria: "DevTools", fuente: "Google Developers Blog", url: "https://developers.googleblog.com/atom.xml", temas: ["DevTools", "Infra"] },
  { categoria: "Cloud-Infra", fuente: "CloudTech", url: "https://cloudcomputing-news.net/feed", temas: ["Infra", "DevOps"] },
  { categoria: "Cloud-Infra", fuente: "AWS News Blog", url: "https://aws.amazon.com/blogs/aws/feed/", temas: ["Infra", "DevOps"] },
  { categoria: "Negocio-Startups", fuente: "Crunchbase AI", url: "https://news.crunchbase.com/sections/ai/feed/", temas: ["Negocio", "IA"] },
];

const STORE_PATH = path.join(process.cwd(), "data", "ia-tech-news.json");
const OBSIDIAN_ROOT = "/Users/enriquetecfan/Documents/obisidian-vault";
const OBS_TWITTER_DIR = path.join(OBSIDIAN_ROOT, "redes sociales", "twitter");
const OBS_LINKEDIN_DIR = path.join(OBSIDIAN_ROOT, "redes sociales", "linkedin");

function textTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || "";
}

function hashId(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex").slice(0, 16);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 70);
}

async function loadStore(): Promise<StoreData> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    return JSON.parse(raw) as StoreData;
  } catch {
    return { news: [], drafts: [] };
  }
}

async function saveStore(data: StoreData) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

async function fetchFeedItems(feed: { categoria: string; fuente: string; url: string; temas: string[] }): Promise<NewsItem[]> {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "MaraOS/1.0 (+ia-tech-news)" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Feed ${feed.fuente} failed: ${res.status}`);
  const xml = await res.text();

  const items: NewsItem[] = [];

  const rssItems = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const chunk of rssItems) {
    const titulo = textTag(chunk, "title");
    const link = textTag(chunk, "link");
    const resumen = textTag(chunk, "description").replace(/<[^>]+>/g, " ").trim();
    const pub = textTag(chunk, "pubDate") || new Date().toISOString();
    if (!titulo) continue;
    items.push({
      id: hashId(`${feed.fuente}:${link || titulo}`),
      titulo,
      fuente: feed.fuente,
      fecha: new Date(pub).toISOString(),
      resumen: resumen.slice(0, 500),
      temas: feed.temas,
      categoria: feed.categoria,
      url: link,
    });
  }

  const atomEntries = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  for (const chunk of atomEntries) {
    const titulo = textTag(chunk, "title");
    const summary = textTag(chunk, "summary") || textTag(chunk, "content");
    const updated = textTag(chunk, "updated") || textTag(chunk, "published") || new Date().toISOString();
    const linkMatch = chunk.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
    const link = linkMatch?.[1] || "";
    if (!titulo) continue;
    items.push({
      id: hashId(`${feed.fuente}:${link || titulo}`),
      titulo,
      fuente: feed.fuente,
      fecha: new Date(updated).toISOString(),
      resumen: summary.replace(/<[^>]+>/g, " ").trim().slice(0, 500),
      temas: feed.temas,
      categoria: feed.categoria,
      url: link,
    });
  }

  return items;
}

async function refreshNews(existing: StoreData): Promise<StoreData> {
  const preserved = new Map(existing.news.map((n) => [n.id, n]));
  const all: NewsItem[] = [];

  for (const feed of FEEDS) {
    try {
      const fetched = await fetchFeedItems(feed);
      for (const item of fetched) {
        const prev = preserved.get(item.id);
        all.push({ ...item, marcadoPara: prev?.marcadoPara, descartada: prev?.descartada });
      }
    } catch (e) {
      console.error("Feed error:", feed.fuente, e);
    }
  }

  const dedup = new Map<string, NewsItem>();
  for (const item of all) {
    if (!dedup.has(item.id)) dedup.set(item.id, item);
  }

  const news = Array.from(dedup.values())
    .sort((a, b) => +new Date(b.fecha) - +new Date(a.fecha))
    .slice(0, 250);

  return { ...existing, news, lastSync: new Date().toISOString() };
}

async function ensureDraftNote(item: NewsItem, canal: "X" | "LinkedIn") {
  const dir = canal === "X" ? OBS_TWITTER_DIR : OBS_LINKEDIN_DIR;
  await fs.mkdir(dir, { recursive: true });

  const fileName = `${slugify(item.titulo)}.md`;
  const fullPath = path.join(dir, fileName);
  const rel = path.relative(OBSIDIAN_ROOT, fullPath);

  const template = `# ${item.titulo}\n\n## Fuente\n- ${item.fuente}${item.url ? `\n- ${item.url}` : ""}\n\n## Resumen noticia\n${item.resumen || "(sin resumen)"}\n\n## Borrador ${canal === "X" ? "X" : "LinkedIn"}\n_Pendiente de redacción por Arvis._\n`;

  try {
    await fs.access(fullPath);
  } catch {
    await fs.writeFile(fullPath, template, "utf-8");
  }

  return rel;
}

export async function GET(req: NextRequest) {
  try {
    const refresh = req.nextUrl.searchParams.get("refresh") === "1";
    let store = await loadStore();
    if (refresh || store.news.length === 0) {
      store = await refreshNews(store);
      await saveStore(store);
    }
    return NextResponse.json(store);
  } catch (error) {
    console.error("GET /api/ia-tech-news error", error);
    return NextResponse.json({ error: "Failed to load IA/Tech news" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { newsId, action, draftId } = body as { newsId?: string; action: string; draftId?: string };

    const store = await loadStore();
    const item = newsId ? store.news.find((n) => n.id === newsId) : undefined;

    if (action !== "mark_reviewed" && !item) {
      return NextResponse.json({ error: "News item not found" }, { status: 404 });
    }

    if (action === "descartar" && item) {
      item.descartada = true;
      item.marcadoPara = undefined;
      store.drafts = store.drafts.filter((d) => d.newsId !== item.id);
    }

    if ((action === "x" || action === "linkedin" || action === "ambos") && item) {
      item.descartada = false;
      item.marcadoPara = action === "x" ? "X" : action === "linkedin" ? "LinkedIn" : "Ambos";

      const canales: Array<"X" | "LinkedIn"> =
        action === "x" ? ["X"] : action === "linkedin" ? ["LinkedIn"] : ["X", "LinkedIn"];

      for (const canal of canales) {
        const existing = store.drafts.find((d) => d.newsId === item.id && d.canal === canal);
        const obsidianRef = await ensureDraftNote(item, canal);

        if (existing) {
          existing.estado = "borrador_en_obsidian";
          existing.obsidianRef = obsidianRef;
        } else {
          store.drafts.push({
            id: `d-${item.id}-${canal.toLowerCase()}`,
            newsId: item.id,
            tituloNoticia: item.titulo,
            canal,
            estado: "borrador_en_obsidian",
            obsidianRef,
          });
        }
      }
    }

    if (action === "mark_reviewed") {
      const target = store.drafts.find((d) => d.id === draftId);
      if (!target) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
      target.estado = "revisado_por_kike";
    }

    await saveStore(store);
    return NextResponse.json(store);
  } catch (error) {
    console.error("POST /api/ia-tech-news error", error);
    return NextResponse.json({ error: "Failed to apply action" }, { status: 500 });
  }
}
