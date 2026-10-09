import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Support large image base64 payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Server-side Google GenAI initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

interface ItemSuggestionInput {
  imageData?: string; // base64 data url or base64 string
  collectionTitle?: string;
  seriesSubtitle?: string;
  itemIndex?: number;
  existingCode?: string;
  language?: "en" | "vi";
  tone?: string;
}

// Helper to call Gemini with retry for transient 503 errors
async function generateContentWithRetry(params: any, retries = 2, delayMs = 1500): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      const isTransient =
        err?.message?.includes("503") ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("UNAVAILABLE") ||
        err?.status === 503;

      if (isTransient && attempt < retries) {
        console.warn(`Gemini 503 transient spike, retrying attempt ${attempt + 1}/${retries}...`);
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

// Endpoint to suggest text for an individual cookware image
app.post("/api/ai/suggest-item", async (req, res) => {
  const {
    imageData,
    collectionTitle = "Ivory Stone Collection",
    seriesSubtitle = "WOOD-HANDLE GRANITE SERIES — NEUTRAL PALETTE",
    itemIndex = 1,
    existingCode,
    language = "en",
    tone = "OEM/ODM Export Cookware Catalogue",
  }: ItemSuggestionInput = req.body;

  try {
    const parts: any[] = [];

    if (imageData && imageData.includes("base64,")) {
      const match = imageData.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    const promptText = `
You are a senior product marketing specialist and copywriter for Elmich, an international cookware and home appliances manufacturer.
Generate product specifications and catalogue copy for this cookware item in a luxury B2B export catalogue.

Context:
- Collection: "${collectionTitle}"
- Series / Palette: "${seriesSubtitle}"
- Item position in catalog: #${itemIndex}
- Language: ${language === "vi" ? "Vietnamese (Tiếng Việt chuẩn thương mại gia dụng cao cấp)" : "English (International B2B OEM/ODM export catalogue style)"}
- Style reference:
  * Code/Tag format: Short prefix with 2-digit number and specification tag, e.g. "IV-01 • FW26 CORE SET", "TP-05 • MUSHROOM TAUPE", "GY-06 • STONE GREY", "BK-07 • MIDNIGHT SPECKLE"
  * Title: Elegant cookware finish and feature headline, e.g. "Ivory Speckle, Full Set + Griddle", "Taupe Stone, Soft-Touch Handle", "Grey Stone, Wood-Tone Handle"
  * Description: Concise 1-2 sentence description highlighting cookware items, finish (granite coating, marble non-stick, forged aluminum, induction base), handle features (faux-wood soft touch, ergonomic), and bundle configuration.

Return JSON matching this schema:
{
  "code": "e.g. IV-01 • FW26 CORE SET",
  "title": "e.g. Ivory Speckle, Full Set + Griddle",
  "description": "e.g. Includes stockpot, casseroles, saucepan, fry pans and square griddle."
}
`;

    parts.push({ text: promptText });

    const response = await generateContentWithRetry({
      model: "gemini-3.8-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING, description: "Item code and version tag" },
            title: { type: Type.STRING, description: "Cookware product headline" },
            description: { type: Type.STRING, description: "Cookware features and set components" },
          },
          required: ["code", "title", "description"],
        },
      },
    });

    const outputText = response.text || "{}";
    const parsed = JSON.parse(outputText);
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error in /api/ai/suggest-item, using smart fallback:", error);
    // Intelligent fallback copy generator so UI never breaks
    const prefix = collectionTitle
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "EL";
    const codeNum = String(itemIndex).padStart(2, "0");

    if (language === "vi") {
      return res.json({
        success: true,
        data: {
          code: `${prefix}-${codeNum} • BỘ SƯU TẬP TIÊU CHUẨN`,
          title: `Nồi chảo vân đá cao cấp, tay cầm cách nhiệt`,
          description: `Chất liệu nhôm đúc phủ chống dính vân đá tự nhiên, đáy từ đa lớp bắt nhiệt nhanh, tay cầm vân gỗ êm ái chống nóng.`,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        code: `${prefix}-${codeNum} • FW26 CORE SPEC`,
        title: `${collectionTitle} Signature Cookware`,
        description: `Forged aluminum body with multi-layer granite non-stick coating, induction base, and ergonomic soft-touch handle.`,
      },
    });
  }
});

// Endpoint to analyze all uploaded images together and suggest the entire page content:
// Series subtitle, collection title, header description, and each item's code, title, and description.
app.post("/api/ai/suggest-full-page", async (req, res) => {
  const {
    items = [], // array of { id, image, currentCode, currentTitle }
    layout = 4,
    language = "en",
  } = req.body;

  const count = Number(layout) || (items.length > 0 ? items.length : 4);
  const activeItems = items.slice(0, count);

  try {
    const parts: any[] = [];

    // Attach all uploaded images as inline data for multimodal vision
    for (let i = 0; i < activeItems.length; i++) {
      const item = activeItems[i];
      const img = item.image;
      if (img && img.startsWith("data:")) {
        const match = img.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      } else if (img && img.startsWith("http")) {
        try {
          const fetchRes = await fetch(img);
          if (fetchRes.ok) {
            const buf = await fetchRes.arrayBuffer();
            const b64 = Buffer.from(buf).toString("base64");
            const mime = fetchRes.headers.get("content-type") || "image/jpeg";
            parts.push({
              inlineData: {
                mimeType: mime,
                data: b64,
              },
            });
          }
        } catch (fetchErr) {
          console.warn("Could not fetch remote image for Gemini:", fetchErr);
        }
      }
    }

    const promptText = `
You are the senior cookware product marketing specialist and copywriter for Elmich, an international household cookware manufacturer.
I have uploaded ${activeItems.length} photos of cookware items (bộ nồi chảo gia dụng) for this catalogue page.

YOUR TASK:
Examine all ${activeItems.length} cookware images together.
Compute and generate the ENTIRE catalogue page content so everything harmonizes with the uploaded cookware photos:
1. Dòng sản phẩm (Series subtitle): Uppercase tracking title specifying the series materials and palette (e.g. "WOOD-HANDLE GRANITE SERIES — NEUTRAL PALETTE" or "CERAMIC NON-STICK SERIES — NORDIC PALETTE").
2. Tên Bộ Sưu Tập (Collection title): Elegant 2-4 word title for this cookware collection (e.g. "Ivory Stone Collection" or "Taupe, Grey & Black Stone").
3. Mô tả đầu trang (Header description): Exactly 1-2 concise sentences (under 30 words) describing the non-stick coating, handle architecture, lid specifications, and pack configurations, matching the exact Elmich demo style:
   Reference: "Marble-finish non-stick coating in warm ivory, paired with faux-wood soft-touch handles and tempered glass lids. Shown in four styling options / pack configurations."
4. Cho từng ảnh (Items 1 to ${count}):
   Generate exactly ${count} matching items corresponding to each image in sequence:
   - "code": Sequential code with prefix and 2-digit number + edition tag (e.g. "IV-01 • FW26 CORE SET", "IV-02 • UTENSIL EDITION", "IV-03 • CLEAN LOGO-FREE", "IV-04 • COPPER INTERIOR" or "TP-05 • MUSHROOM TAUPE", "GY-06 • STONE GREY", "BK-07 • MIDNIGHT SPECKLE").
   - "title": Very concise product headline (3-5 words) specifying the finish/color and configuration (e.g. "Ivory Speckle, Full Set + Griddle" or "Taupe Stone, Soft-Touch Handle").
   - "description": Exactly 1 concise sentence (8-15 words) listing the cookware pieces or standout finish (e.g. "Includes stockpot, casseroles, saucepan, fry pans and square griddle." or "Warm taupe finish with matching soft-touch handles and knobs.").
   - "spotDotColor": Hex color code matching the primary color swatch of this item (e.g. "#f3ede3", "#a3988c", "#7f7f7f", "#2b2b2b", "#b87333").

Language: ${language === "vi" ? "Tiếng Việt (chuẩn thương mại xuất khẩu gia dụng Elmich, ngắn gọn, súc tích)" : "English (International B2B OEM/ODM export catalogue style)"}
Crucial rule: Keep all texts CONCISE and focused strictly on cookware (nồi, chảo, quánh, xửng, tay cầm, lớp chống dính đá). Do not write overly long paragraphs.

Return JSON:
{
  "seriesSubtitle": "...",
  "collectionTitle": "...",
  "headerDescription": "...",
  "items": [
    {
      "code": "...",
      "title": "...",
      "description": "...",
      "spotDotColor": "..."
    }
  ]
}
`;

    parts.push({ text: promptText });

    const response = await generateContentWithRetry({
      model: "gemini-3.8-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            seriesSubtitle: { type: Type.STRING },
            collectionTitle: { type: Type.STRING },
            headerDescription: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  spotDotColor: { type: Type.STRING },
                },
                required: ["code", "title", "description"],
              },
            },
          },
          required: ["seriesSubtitle", "collectionTitle", "headerDescription", "items"],
        },
      },
    });

    const outputText = response.text || "{}";
    const parsed = JSON.parse(outputText);
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error in /api/ai/suggest-full-page, using fallback:", error);
    if (language === "vi") {
      return res.json({
        success: true,
        data: {
          seriesSubtitle: "DÒNG NỒI CHẢO NHÔM ĐÚC VÂN ĐÁ — BỘ SƯU TẬP CAO CẤP",
          collectionTitle: count === 3 ? "Bộ Nồi Chảo Đá Tự Nhiên" : "Bộ Sưu Tập Nồi Chảo Granite",
          headerDescription: "Lớp chống dính vân đá tự nhiên siêu bền, tay cầm vân gỗ cách nhiệt êm ái cùng nắp kính cường lực chịu nhiệt. Tùy biến cấu hình đóng gói theo yêu cầu.",
          items: Array.from({ length: count }).map((_, i) => ({
            code: `EL-${String(i + 1).padStart(2, "0")} • FW26 TIÊU CHUẨN`,
            title: i === 0 ? "Bộ nồi chảo vân đá đầy đủ + Vỉ nướng" : i === 1 ? "Bộ chảo chống dính kèm dụng cụ nấu" : i === 2 ? "Nồi hầm tráng sứ lòng sâu cao cấp" : "Chảo chiên lòng ánh kim viền đồng",
            description: i === 0 ? "Bao gồm nồi canh, chảo rán, quánh bột và chảo nướng vuông." : i === 1 ? "Bộ đồ gia dụng đồng bộ kèm bộ xẻng muôi gỗ tự nhiên." : i === 2 ? "Thiết kế tinh giản không in logo — sẵn sàng cho OEM/ODM." : "Vỏ ngoài sơn chịu nhiệt cao cấp, lòng phủ chống dính ánh kim sang trọng.",
            spotDotColor: i === 0 ? "#e8ded2" : i === 1 ? "#f3ede3" : i === 2 ? "#a3988c" : "#b87333",
          })),
        },
      });
    }

    return res.json({
      success: true,
      data: {
        seriesSubtitle: "WOOD-HANDLE GRANITE SERIES — NEUTRAL PALETTE",
        collectionTitle: count === 3 ? "Taupe, Grey & Black Stone" : "Ivory Stone Collection",
        headerDescription: "Marble-finish non-stick coating in warm neutral tones, paired with faux-wood soft-touch handles and tempered glass lids. Shown in coordinated kitchen configurations.",
        items: Array.from({ length: count }).map((_, i) => ({
          code: `IV-${String(i + 1).padStart(2, "0")} • FW26 CORE SET`,
          title: i === 0 ? "Ivory Speckle, Full Set + Griddle" : i === 1 ? "Ivory Speckle, with Utensil Set" : i === 2 ? "Ivory Smooth, Unbranded Tooling" : "Ivory Body, Copper-Tone Interior",
          description: i === 0 ? "Includes stockpot, casseroles, saucepan, fry pans and square griddle." : i === 1 ? "Cookware set bundled with matching cooking utensils." : i === 2 ? "Neutral tooling with no visible branding — ready for private label." : "Ivory exterior finished with a warm copper-tone non-stick interior.",
          spotDotColor: i === 0 ? "#e8ded2" : i === 1 ? "#f3ede3" : i === 2 ? "#e5ded4" : "#b87333",
        })),
      },
    });
  }
});

// Endpoint to batch suggest all items for an entire catalog page
app.post("/api/ai/batch-suggest", async (req, res) => {
  try {
    const {
      items = [], // array of { id, imageData, currentCode, currentTitle }
      collectionTitle = "Ivory Stone Collection",
      seriesSubtitle = "WOOD-HANDLE GRANITE SERIES — NEUTRAL PALETTE",
      language = "en",
    } = req.body;

    const parts: any[] = [];

    // Attach any images provided
    items.forEach((item: any, idx: number) => {
      if (item.imageData && item.imageData.includes("base64,")) {
        const match = item.imageData.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }
    });

    const count = items.length || 4;
    const prompt = `
You are the lead product copywriter for Elmich Cookware.
Generate matching product catalogue entries for all ${count} items on this catalogue page.

Collection: "${collectionTitle}"
Series Subtitle: "${seriesSubtitle}"
Language: ${language === "vi" ? "Tiếng Việt" : "English"}

Requirements:
- Sequential numbering for item codes (e.g. prefix based on collection, like IV-01, IV-02, IV-03, IV-04 or TP-05, GY-06, BK-07).
- Each item should highlight different finishes, configurations, or handle types (e.g., Full Set + Griddle, Utensil Edition, Clean Logo-Free, Copper Interior, Soft-Touch Handle).
- Descriptions should be concise, professional, and suited for high-end retail/OEM presentation.

Return JSON format:
{
  "items": [
    {
      "code": "...",
      "title": "...",
      "description": "..."
    }
  ]
}
`;

    parts.push({ text: prompt });

    const response = await generateContentWithRetry({
      model: "gemini-3.8-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["code", "title", "description"],
              },
            },
          },
          required: ["items"],
        },
      },
    });

    const outputText = response.text || "{}";
    const parsed = JSON.parse(outputText);
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error in /api/ai/batch-suggest, using smart fallback:", error);
    const { items = [], collectionTitle = "Ivory Stone Collection", language = "en" } = req.body;
    const count = items.length || 4;
    const prefix = collectionTitle
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "EL";

    const fallbackItems = Array.from({ length: count }).map((_, idx) => {
      const codeNum = String(idx + 1).padStart(2, "0");
      if (language === "vi") {
        const viTitles = [
          "Bộ nồi chảo vân đá nguyên bản kèm vỉ nướng",
          "Bộ chảo chống dính kèm dụng cụ nấu gỗ sồi",
          "Nồi hầm tráng sứ lòng sâu cao cấp",
          "Chảo chiên lòng ánh kim viền đồng chống trầy",
        ];
        const viDescs = [
          "Bao gồm nồi canh, chảo rán, quánh bột và chảo nướng vuông đáy từ.",
          "Bộ đồ gia dụng đồng bộ kèm bộ xẻng muôi gỗ tự nhiên kháng khuẩn.",
          "Thiết kế tinh giản không in logo — sẵn sàng cho chương trình OEM/ODM.",
          "Vỏ ngoài sơn chịu nhiệt cao cấp, lòng phủ chống dính ánh kim sang trọng.",
        ];
        return {
          code: `${prefix}-${codeNum} • FW26 TIÊU CHUẨN`,
          title: viTitles[idx % viTitles.length],
          description: viDescs[idx % viDescs.length],
        };
      }

      const enTitles = [
        "Speckle Granite, Full Cookware Set + Griddle",
        "Granite Edition, with Matching Utensil Set",
        "Smooth Neutral, Unbranded Tooling OEM",
        "Classic Body, Copper-Tone Non-Stick Interior",
      ];
      const enDescs = [
        "Includes stockpot, casseroles, saucepan, fry pans and square griddle.",
        "Cookware set bundled with matching ergonomic cooking utensils.",
        "Neutral tooling with no visible branding — ready for private label.",
        "Exterior finished with a warm copper-tone scratch-resistant interior.",
      ];
      return {
        code: `${prefix}-${codeNum} • FW26 CORE SET`,
        title: enTitles[idx % enTitles.length],
        description: enDescs[idx % enDescs.length],
      };
    });

    return res.json({ success: true, data: { items: fallbackItems } });
  }
});

// Endpoint to suggest header content (Collection title, subtitle, header description)
app.post("/api/ai/suggest-header", async (req, res) => {
  const { topic = "cookware series", language = "en" } = req.body;
  try {
    const response = await generateContentWithRetry({
      model: "gemini-3.8-flash",
      contents: `
Generate an elegant Elmich cookware catalog page header based on this keyword or product line concept: "${topic}".
Language: ${language === "vi" ? "Tiếng Việt" : "English"}.

Style references:
- Subtitle: Uppercase tracking series name, e.g. "WOOD-HANDLE GRANITE SERIES — NEUTRAL PALETTE"
- Title: Serif luxury title, e.g. "Ivory Stone Collection" or "Taupe, Grey & Black Stone"
- Description: 2-line technical & aesthetic summary, e.g. "Marble-finish non-stick coating in warm ivory, paired with faux-wood soft-touch handles and tempered glass lids. Shown in four styling options / pack configurations."
`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            seriesSubtitle: { type: Type.STRING },
            collectionTitle: { type: Type.STRING },
            headerDescription: { type: Type.STRING },
          },
          required: ["seriesSubtitle", "collectionTitle", "headerDescription"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error in /api/ai/suggest-header, using fallback:", error);
    if (language === "vi") {
      return res.json({
        success: true,
        data: {
          seriesSubtitle: "DÒNG NỒI CHẢO NHÔM ĐÚC VÂN ĐÁ — BỘ SƯU TẬP CAO CẤP",
          collectionTitle: topic.length > 5 ? topic : "Bộ Sưu Tập Royal Stone",
          headerDescription: "Chất liệu nhôm đúc nguyên khối phủ chống dính vân đá tự nhiên siêu bền, tay cầm vân gỗ cách nhiệt êm ái cùng nắp kính cường lực chịu nhiệt cao cấp.",
        },
      });
    }

    return res.json({
      success: true,
      data: {
        seriesSubtitle: "WOOD-HANDLE FORGED GRANITE SERIES — EXPORT EDITION",
        collectionTitle: topic.length > 5 ? topic : "Royal Granite Collection",
        headerDescription: "Marble-finish non-stick coating in premium neutral tones, paired with faux-wood soft-touch handles and tempered glass lids. Engineered for modern OEM/ODM cookware programmes.",
      },
    });
  }
});

// Mount Vite or static server
if (process.env.NODE_ENV !== "production") {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Elmich Catalog Studio server running on http://0.0.0.0:${port}`);
});
