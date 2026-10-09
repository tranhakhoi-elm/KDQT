import express from "express";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();

// Support large image payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Enable CORS for all API calls
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Helper for Gemini AI client with GEMINI_API_KEY from Vercel environment
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in environment variables");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build-vercel",
      },
    },
  });
}

// 1. Endpoint: /api/ai/suggest-full-page
app.post("/api/ai/suggest-full-page", async (req, res) => {
  const { items = [], layout = 4, language = "en" } = req.body;

  try {
    const ai = getGeminiClient();
    const parts: any[] = [];

    const promptText = `
You are an expert cookware creative director and product copywriter for Elmich, a prestigious cookware manufacturer.
Analyze all the provided cookware images (${layout} products).
Generate a cohesive, premium export catalogue theme strictly focused on cookware / pots and pans (bộ nồi chảo gia dụng).

Return JSON with:
1. "seriesSubtitle": Short uppercase series name (e.g. "WOOD-HANDLE GRANITE SERIES — NEUTRAL PALETTE")
2. "collectionTitle": Elegant collection name (e.g. "Ivory Stone Collection" or "Royal Granite Collection")
3. "headerDescription": Concise technical summary (2-3 sentences) detailing the non-stick coating, forged aluminum body, soft-touch ergonomic wood/silicone handles, and tempered glass lids.
4. "items": Array of ${layout} items, each with:
   - "code": Sequential code (e.g. "IV-01 • CORE SET", "IV-02 • UTENSIL EDITION")
   - "title": Short product title
   - "description": Concise description (1-2 sentences) of what's included or features
   - "spotDotColor": Hex color of the cookware body

Language: ${language === "vi" ? "VIETNAMESE (Tiếng Việt)" : "ENGLISH"}.
Keep text concise and elegant.
`;

    parts.push({ text: promptText });

    items.slice(0, layout).forEach((item: any, idx: number) => {
      if (item.image && item.image.startsWith("data:image/")) {
        const matches = item.image.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
          parts.push({ text: `[Product Image #${idx + 1}]` });
        }
      }
    });

    const response = await ai.models.generateContent({
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

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Vercel AI full-page error, using fallback copy:", error);
    // Smart Cookware Fallback
    if (language === "vi") {
      return res.json({
        success: true,
        data: {
          seriesSubtitle: "DÒNG NỒI CHẢO NHÔM ĐÚC VÂN ĐÁ — BỘ SƯU TẬP CAO CẤP",
          collectionTitle: "Bộ Sưu Tập Nồi Chảo Đá Tự Nhiên",
          headerDescription: "Chất liệu nhôm đúc nguyên khối phủ chống dính vân đá tự nhiên siêu bền, tay cầm vân gỗ cách nhiệt êm ái cùng nắp kính cường lực chịu nhiệt cao cấp. Phù hợp cho mọi loại bếp kể cả bếp từ.",
          items: [
            { code: "EL-01 • FW26 TIÊU CHUẨN", title: "Bộ nồi chảo vân đá đầy đủ + Vỉ nướng", description: "Bao gồm nồi canh, chảo rán, quánh bột và chảo nướng vuông.", spotDotColor: "#e8ded2" },
            { code: "EL-02 • FW26 TIÊU CHUẨN", title: "Bộ chảo chống dính kèm dụng cụ nấu", description: "Bộ đồ gia dụng đồng bộ kèm bộ xẻng muôi gỗ tự nhiên.", spotDotColor: "#f3ede3" },
            { code: "EL-03 • FW26 TIÊU CHUẨN", title: "Nồi hầm tráng sứ lòng sâu cao cấp", description: "Thiết kế tinh giản không in logo — sẵn sàng cho OEM/ODM.", spotDotColor: "#a3988c" },
            { code: "EL-04 • FW26 TIÊU CHUẨN", title: "Chảo chiên lòng ánh kim viền đồng", description: "Vỏ ngoài sơn chịu nhiệt cao cấp, lòng phủ chống dính ánh kim sang trọng.", spotDotColor: "#b87333" },
          ].slice(0, layout),
        },
      });
    }

    return res.json({
      success: true,
      data: {
        seriesSubtitle: "WOOD-HANDLE GRANITE SERIES — NEUTRAL PALETTE",
        collectionTitle: "Contemporary Stone Collection",
        headerDescription: "Marble-finish non-stick coating in warm neutral tones, paired with faux-wood soft-touch handles and tempered glass lids. Engineered for modern culinary programmes.",
        items: [
          { code: "IV-01 • FW26 CORE SET", title: "Ivory Speckle, Full Set + Griddle", description: "Includes stockpot, casseroles, saucepan, fry pans and square griddle.", spotDotColor: "#e8ded2" },
          { code: "IV-02 • UTENSIL EDITION", title: "Ivory Speckle, with Utensil Set", description: "Cookware set bundled with matching cooking utensils.", spotDotColor: "#f3ede3" },
          { code: "IV-03 • CLEAN LOGO-FREE", title: "Ivory Smooth, Unbranded Tooling", description: "Neutral tooling with no visible branding — ready for private label.", spotDotColor: "#a3988c" },
          { code: "IV-04 • COPPER INTERIOR", title: "Ivory Body, Copper-Tone Interior", description: "Ivory exterior finished with a warm copper-tone non-stick interior.", spotDotColor: "#b87333" },
        ].slice(0, layout),
      },
    });
  }
});

// 2. Endpoint: /api/ai/suggest-item
app.post("/api/ai/suggest-item", async (req, res) => {
  const {
    imageData,
    collectionTitle = "Ivory Stone Collection",
    seriesSubtitle = "WOOD-HANDLE GRANITE SERIES",
    itemIndex = 1,
    existingCode,
    language = "en",
  } = req.body;

  try {
    const ai = getGeminiClient();
    const parts: any[] = [];
    const promptText = `
Cookware item #${itemIndex} for "${collectionTitle}" (${seriesSubtitle}).
Suggest:
1. "code": sequential item code (e.g. "IV-0${itemIndex} • ${language === "vi" ? "PHIÊN BẢN MỚI" : "EDITION"}")
2. "title": short title (under 6 words)
3. "description": concise description (1-2 sentences)
Language: ${language === "vi" ? "Vietnamese" : "English"}.
`;
    parts.push({ text: promptText });

    if (imageData && imageData.startsWith("data:image/")) {
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2],
          },
        });
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["code", "title", "description"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Vercel AI single item error, using fallback:", error);
    const codeNum = String(itemIndex).padStart(2, "0");
    if (language === "vi") {
      return res.json({
        success: true,
        data: {
          code: existingCode || `EL-${codeNum} • BỘ NỒI CAO CẤP`,
          title: `Nồi Chảo Nhôm Đúc Phủ Đá Tự Nhiên #${itemIndex}`,
          description: "Chất liệu hợp kim nhôm nguyên khối, phủ chống dính vân đá 5 lớp bền bỉ, tay cầm vân gỗ cách nhiệt an toàn.",
        },
      });
    }

    return res.json({
      success: true,
      data: {
        code: existingCode || `IV-${codeNum} • GRANITE EDITION`,
        title: `Forged Granite Cookware Piece #${itemIndex}`,
        description: "Forged aluminum construction with multi-layer marble non-stick finish and ergonomic soft-touch wood-feel handle.",
      },
    });
  }
});

// 3. Endpoint: /api/ai/suggest-header
app.post("/api/ai/suggest-header", async (req, res) => {
  const { topic = "cookware series", language = "en" } = req.body;
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Create catalog header for cookware theme: "${topic}". Language: ${language === "vi" ? "Vietnamese" : "English"}.`,
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
  } catch (err: any) {
    if (language === "vi") {
      return res.json({
        success: true,
        data: {
          seriesSubtitle: "DÒNG NỒI CHẢO NHÔM ĐÚC VÂN ĐÁ — BỘ SƯU TẬP CAO CẤP",
          collectionTitle: topic.length > 5 ? topic : "Bộ Sưu Tập Nồi Chảo Royal Stone",
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

// 4. Endpoint: /api/proxy-image
app.get("/api/proxy-image", async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    return res.status(400).send("Missing url parameter");
  }
  try {
    const fetchRes = await fetch(imageUrl);
    if (!fetchRes.ok) {
      return res.status(fetchRes.status).send("Failed to fetch image");
    }
    const contentType = fetchRes.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");
    const arrayBuffer = await fetchRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error("Proxy error:", err);
    return res.status(500).send(err.message || "Failed to proxy image");
  }
});

export default app;
