import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for base64 image uploads
app.use(express.json({ limit: "15mb" }));

// Initialize GoogleGenAI server-side with User-Agent
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in process.env");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API 1: Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve public static assets (icons, manifest, sw) with CORS headers
app.use(
  express.static(path.join(process.cwd(), "public"), {
    setHeaders: (res, filePath) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (filePath.endsWith(".json") || filePath.endsWith(".webmanifest")) {
        res.setHeader("Content-Type", "application/manifest+json");
      }
    },
  })
);

// Serve Web App Manifest with CORS headers & correct Content-Type for PWABuilder
app.get(["/manifest.json", "/manifest.webmanifest", "/site.webmanifest"], (req, res) => {
  res.setHeader("Content-Type", "application/manifest+json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.sendFile(path.join(process.cwd(), "public", "manifest.json"));
});

// Serve Service Worker with CORS headers
app.get("/sw.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.sendFile(path.join(process.cwd(), "public", "sw.js"));
});

// API 2: Scan Receipt using Gemini Vision
app.post("/api/scan-receipt", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    // Strip header if data URL was passed
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const ai = getGenAI();

    const prompt = `You are an expert OCR receipt scanner for an expense-splitting app.
Examine this bill or receipt image carefully and extract:
1. Merchant/Store or Expense Title (e.g. "Bistro Parisien", "7-Eleven Tokyo", "Uber Ride", "Marriott Hotel").
2. Transaction Date (in YYYY-MM-DD format if visible, or current date if missing).
3. Total Amount (numerical number only, e.g. 125.50).
4. Currency Code (3-letter ISO string: e.g. USD, EUR, JPY, GBP, CAD, AUD, INR, CHF, SGD, MXN, BRL).
5. Tax Amount (if indicated, else 0).
6. Tip Amount (if indicated, else 0).
7. Category (Must be one of: "dining", "groceries", "transport", "accommodation", "entertainment", "shopping", "utilities", "other").
8. Line items array: array of individual item objects with "name" (string) and "price" (number, unit price or total item price).

Be accurate with currency detection (symbol $ -> USD/CAD/AUD, € -> EUR, ¥ -> JPY, £ -> GBP, ₹ -> INR, etc.).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
        { text: prompt },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Merchant or receipt title" },
            date: { type: Type.STRING, description: "YYYY-MM-DD date" },
            totalAmount: { type: Type.NUMBER, description: "Grand total on receipt" },
            currency: { type: Type.STRING, description: "3-letter currency ISO code" },
            taxAmount: { type: Type.NUMBER, description: "Tax amount" },
            tipAmount: { type: Type.NUMBER, description: "Tip or gratuity amount" },
            category: {
              type: Type.STRING,
              description: "dining, groceries, transport, accommodation, entertainment, shopping, utilities, or other",
            },
            lineItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                },
                required: ["name", "price"],
              },
            },
          },
          required: ["title", "totalAmount", "currency", "category", "lineItems"],
        },
      },
    });

    const jsonText = response.text || "{}";
    const parsedData = JSON.parse(jsonText);

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (err: any) {
    console.error("Error scanning receipt with Gemini:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to parse receipt image",
    });
  }
});

// API 2.5: Parse Voice Expense using Gemini Audio / Multimodal NLP
app.post("/api/parse-voice-expense", async (req, res) => {
  try {
    const { transcript, audioBase64, mimeType = "audio/webm", groupMembers = [], baseCurrency = "USD" } = req.body;

    if (!transcript && !audioBase64) {
      return res.status(400).json({ error: "Either transcript or audioBase64 is required" });
    }

    const ai = getGenAI();

    const membersListStr = Array.isArray(groupMembers) && groupMembers.length > 0
      ? groupMembers.map((m: any) => (typeof m === "string" ? m : m.name)).join(", ")
      : "Group members";

    const systemPrompt = `You are an AI expense logger for a multi-currency expense splitting app.
Analyze the provided voice speech recording or transcribed speech text.
Extract structured expense details based on what was said.

Available Group Members: [${membersListStr}]
Group Base Currency: ${baseCurrency}

Rules for extraction:
1. Title: concise name/description (e.g. "Pizza & Drinks", "Uber to airport", "Train tickets", "Hotel Paris", "Groceries").
2. Total Amount: numerical price (e.g. 45.50). Convert spoken words ("fifty dollars") into numbers (50).
3. Currency Code: ISO 3-letter currency code (e.g. USD, EUR, JPY, GBP, CAD, AUD, INR, CHF, SGD, BRL). Default to "${baseCurrency}" if no currency specified.
4. Category: Must be one of: "dining", "groceries", "transport", "accommodation", "entertainment", "shopping", "utilities", or "other".
5. Payer Name: Identify who paid if mentioned (match closest name from Group Members [${membersListStr}]). If not mentioned or if "I" / "we" / "myself" is spoken, leave as empty string "".
6. Notes: Brief text summary of what was heard.`;

    const contents: any[] = [];

    if (audioBase64) {
      const cleanAudio = audioBase64.replace(/^data:audio\/[a-z0-9]+;base64,/, "");
      contents.push({
        inlineData: {
          mimeType,
          data: cleanAudio,
        },
      });
      contents.push({ text: systemPrompt + (transcript ? `\nRecognized transcript: "${transcript}"` : "") });
    } else {
      contents.push({ text: `${systemPrompt}\n\nSpoken Voice Text: "${transcript}"` });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Short expense title" },
            totalAmount: { type: Type.NUMBER, description: "Numeric amount" },
            currency: { type: Type.STRING, description: "3-letter currency ISO code" },
            category: {
              type: Type.STRING,
              description: "dining, groceries, transport, accommodation, entertainment, shopping, utilities, or other",
            },
            payerName: { type: Type.STRING, description: "Name of member who paid, or empty string" },
            notes: { type: Type.STRING, description: "Short voice note summary" },
          },
          required: ["title", "totalAmount", "currency", "category"],
        },
      },
    });

    const jsonText = response.text || "{}";
    const parsedData = JSON.parse(jsonText);

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (err: any) {
    console.error("Error parsing voice expense with Gemini:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to parse voice expense",
    });
  }
});

// API 3: Live Exchange Rates Fallback
app.get("/api/exchange-rates", (req, res) => {
  // Baseline rates relative to USD
  const rates = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.78,
    JPY: 155.0,
    CAD: 1.38,
    AUD: 1.52,
    INR: 84.5,
    CHF: 0.88,
    SGD: 1.35,
    AED: 3.67,
    MXN: 18.2,
    BRL: 5.45,
    KRW: 1380.0,
    THB: 36.5,
    NZD: 1.65,
    SEK: 10.8,
    NOK: 10.9,
    ZAR: 18.1,
  };

  res.json({
    base: "USD",
    rates,
    lastUpdated: new Date().toISOString(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
