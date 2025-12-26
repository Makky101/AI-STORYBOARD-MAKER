import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

console.log(process.env.GEMINI_API_KEY);
console.log(process.env.HF_API_KEY);
console.log(process.env.JWT_SECRET);

// Mock Data
const MOCK_SCRIPT = [
    {
        scene_number: 1,
        title: "The Mysterious Discovery",
        location: "Attic - Day",
        description: "A dusty attic filled with old trunks. Sunlight streams through a small window.",
        action: "A young boy, SAM (10), opens an old wooden chest and finds a glowing blue key.",
        mood: "Mysterious, Wonder",
        image_prompt: "A cinematic shot of a young boy opening an old wooden chest in a dusty attic, glowing blue light emitting from within, dust particles in sunlight, mysterious atmosphere"
    },
    {
        scene_number: 2,
        title: "The Key's Power",
        location: "Attic - Day",
        description: "The key pulses with light. Sam picks it up, amazed.",
        action: "Sam lifts the key. The room slightly vibrates.",
        mood: "Magical",
        image_prompt: "A close up of a glowing blue key in a child's hand, magical energy emanating, dusty attic background, cinematic lighting"
    }
];

const MOCK_IMAGE_URL = "https://placehold.co/600x400/png?text=AI+Generated+Image+Effect";

// Script Generation
async function generateScript(input) {
    console.log(process.env.GEMINI_API_KEY);
    if (!process.env.GEMINI_API_KEY) {
        console.log("Using Mock Script Service");
        return MOCK_SCRIPT;
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      You are a professional screenwriter. Convert the following user idea into a structured movie script JSON.
      User Idea: "${input}"
      
      Requirements:
      - Return ONLY a valid JSON array of objects.
      - Each object must have: scene_number (int), title (string), location (string), description (string), action (string), mood (string), and image_prompt (string).
      - The 'image_prompt' should be a detailed visual description suitable for an AI image generator (Stable Diffusion/DALL-E), describing the scene vividly.
      - Do not include markdown code blocks like \`\`\`json. Just the raw JSON.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up potential markdown formatting if Gemini adds it despite instructions
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Error generating script with Gemini:", error);
        return MOCK_SCRIPT; // Fallback
    }
}

// Image Generation
async function generateImage(prompt) {
    if (!process.env.HF_API_KEY) {
        console.log("HF_API_KEY missing, using mock.");
        console.log("Using Mock Image Service");
        return MOCK_IMAGE_URL;
    }

    try {
        console.log(`Calling Hugging Face for prompt: ${prompt.substring(0, 30)}...`);
        const response = await axios.post(
            "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
            { inputs: prompt },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_API_KEY}`,
                    "Accept": "image/png"
                },
                responseType: "arraybuffer", // Important for binary image data
            }
        );
        console.log(`Success. Response Status: ${response.status}, Size: ${response.data.length}`);

        // Convert binary to base64 for easy frontend display
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');
        return `data:image/jpeg;base64,${base64Image}`;

    } catch (error) {
        console.error(`ERROR: ${error.message}`);
        if (error.response) console.error(`Response Status: ${error.response.status}`);
        console.error("Error generating image with Hugging Face:", error);
        return MOCK_IMAGE_URL;
    }
}

export { generateScript, generateImage };
