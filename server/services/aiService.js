import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function generateScript(input) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing.");
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
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Error generating script with Gemini:", error);
        throw error;
    }
}

async function generateImage(prompt) {
    const modelId = process.env.HF_MODEL_ID || "stabilityai/stable-diffusion-xl-base-1.0";
    const token = process.env.HF_API_KEY?.trim();
    if (!token) {
        throw new Error("HF_API_KEY is missing.");
    }

    try {
        
        const response = await axios.post(
            `https://router.huggingface.co/hf-inference/models/${modelId}`,
            { inputs: prompt },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Accept": "image/png"
                },
                responseType: "arraybuffer",
            }
        );
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');
        return `data:image/jpeg;base64,${base64Image}`;

    } catch (error) {
        let errorMessage = `Image generation failed (${modelId})`;
        if (error.response) {
            const status = error.response.status;
            if (status === 402) {
                errorMessage = `Hugging Face API Error: 402 Payment Required for model ${modelId}.`;
            }
            else if (status === 401) {
                errorMessage = `Hugging Face API Error: 401 Unauthorized. Your HF_API_KEY is invalid.`;
            }
            else if (status === 429) {
                errorMessage = "Hugging Face API Error: 429 Too Many Requests.";
            }
            else {
                errorMessage = `Hugging Face API Error: ${status} - ${error.message}`;
            }
        }
        else {
            errorMessage = `Error connecting to Hugging Face: ${error.message}`;
        }
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
}

export { generateScript, generateImage };
