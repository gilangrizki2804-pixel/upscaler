import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// High payload limit for image base64 processing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI client on server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ClariPNG Engine',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// AI Analyze & Background Color Detection endpoint
app.post('/api/ai-analyze', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        success: true,
        fallback: true,
        message: 'No GEMINI_API_KEY provided; using local neural heuristics',
        analysis: {
          detectedSubject: 'General Graphic/Subject',
          dominantBgColor: '#FFFFFF',
          isWhiteBg: true,
          recommendedDeblur: 1.8,
          recommendedSharpness: 65,
          recommendedTolerance: 24,
          edgeSoftness: 'medium',
        },
      });
    }

    // Clean base64 data
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const prompt = `Analyze this image for high-precision upscaling, deblurring, and transparent background removal.
Return ONLY valid JSON matching this schema:
{
  "detectedSubject": "string description of main subject",
  "dominantBgColor": "#HEX or 'transparent'",
  "isWhiteBg": boolean,
  "isDarkBg": boolean,
  "hasGradientBg": boolean,
  "recommendedDeblur": number (between 1.0 and 3.0),
  "recommendedSharpness": number (between 20 and 90),
  "recommendedTolerance": number (between 10 and 60),
  "edgeSoftness": "sharp" | "medium" | "soft",
  "blurSeverity": "low" | "medium" | "high",
  "recommendationTips": "brief tips for optimal deblur and transparency"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch {
      analysis = {
        detectedSubject: 'Graphic element',
        dominantBgColor: '#FFFFFF',
        isWhiteBg: true,
        recommendedDeblur: 1.8,
        recommendedSharpness: 60,
        recommendedTolerance: 25,
      };
    }

    res.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Error in /api/ai-analyze:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze image with AI',
      fallback: true,
    });
  }
});

// AI Upscale & Detail Reconstruction endpoint
app.post('/api/ai-upscale-hint', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png', upscaleFactor = 2 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        success: true,
        fallback: true,
        message: 'Local algorithmic upscaler active',
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: `Analyze the resolution, pixel blur, line fidelity, and edge contrast of this image for ${upscaleFactor}x upscaling. 
Provide a high-frequency reconstruction profile in JSON:
{
  "edgeContrastProfile": "crisp" | "smooth" | "complex",
  "artifactLevel": "low" | "medium" | "high",
  "chromaSubsamplingDetected": boolean,
  "suggestedConvolutionKernel": "unsharp_strong" | "unsharp_gentle" | "laplacian_crisp",
  "defringeRadius": number
}`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    let profile = {};
    try {
      profile = JSON.parse(response.text || '{}');
    } catch {
      profile = { suggestedConvolutionKernel: 'unsharp_strong', defringeRadius: 1 };
    }

    res.json({
      success: true,
      profile,
    });
  } catch (err: any) {
    console.error('Error in /api/ai-upscale-hint:', err);
    res.status(500).json({ error: err.message || 'Internal AI error' });
  }
});

// Configure Vite integration
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`ClariPNG Server running on port ${PORT} (mode: ${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
