// ============================================================================
// AISERVICE.JS - AI Integration Service
// ============================================================================
// This file handles all interactions with external AI services:
// 1. Google Gemini API - for generating movie scripts from user ideas
// 2. Hugging Face API - for generating images from text descriptions

// ----------------------------------------------------------------------------
// STEP 1: Import Required Packages
// ----------------------------------------------------------------------------
// GoogleGenerativeAI: Official SDK for Google's Gemini AI
import { GoogleGenerativeAI } from '@google/generative-ai';

// axios: HTTP client for making API requests to Hugging Face
import axios from 'axios';

// dotenv: Loads environment variables (API keys) from .env file
import dotenv from 'dotenv';

// ----------------------------------------------------------------------------
// STEP 2: Load Environment Variables
// ----------------------------------------------------------------------------
dotenv.config();

// ============================================================================
// FUNCTION 1: Generate Script from User Idea
// ============================================================================
// This function takes a user's movie idea (like "A robot discovers love")
// and uses Google's Gemini AI to convert it into a structured script with scenes.
//
// Input: A string describing the movie idea
// Output: An array of scene objects, each containing:
//   - scene_number: The order of the scene (1, 2, 3, etc.)
//   - title: A short title for the scene
//   - location: Where the scene takes place
//   - description: What the scene looks like
//   - action: What happens in the scene
//   - mood: The emotional tone (e.g., "mysterious", "joyful")
//   - image_prompt: A detailed description for generating an image of this scene

async function generateScript(input) {
    // ------------------------------------------------------------------------
    // Step 1.1: Check if we have the required API key
    // ------------------------------------------------------------------------
    // The GEMINI_API_KEY must be set in the .env file
    // If it's missing, we can't proceed, so we throw an error
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing. Check your environment variables.");
    }

    try {
        // --------------------------------------------------------------------
        // Step 1.2: Initialize the Gemini AI client
        // --------------------------------------------------------------------
        // Create a new instance of the Gemini AI client using our API key
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Get the specific AI model we want to use
        // "gemini-1.5-flash" is a fast, efficient model good for text generation
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // --------------------------------------------------------------------
        // Step 1.3: Create the prompt for the AI
        // --------------------------------------------------------------------
        // We give the AI very specific instructions on what we want:
        // - Act as a professional screenwriter
        // - Convert the user's idea into a structured JSON format
        // - Include specific fields for each scene
        // - Make image_prompt very detailed for better image generation later
        const prompt = `
You are a professional screenwriter. Convert the following user idea into a structured movie script JSON.
User Idea: "${input}"

Requirements:
- Return ONLY a valid JSON array of objects.
- Each object must have: scene_number (int), title (string), location (string), description (string), action (string), mood (string), and image_prompt (string).
- The 'image_prompt' should be a detailed visual description suitable for an AI image generator (Stable Diffusion/DALL-E), describing the scene vividly.
- Do not include markdown code blocks like \`\`\`json. Just the raw JSON.
        `;

        // --------------------------------------------------------------------
        // Step 1.4: Send the prompt to Gemini and wait for response
        // --------------------------------------------------------------------
        // This is an async operation - we wait for the AI to generate the script
        const result = await model.generateContent(prompt);

        // Extract the response object from the result
        const response = await result.response;

        // Get the actual text content from the response
        const text = response.text();

        // --------------------------------------------------------------------
        // Step 1.5: Clean up the response
        // --------------------------------------------------------------------
        // Sometimes the AI adds markdown formatting even though we asked it not to
        // We remove any ```json or ``` markers and trim whitespace
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // --------------------------------------------------------------------
        // Step 1.6: Parse the JSON and return
        // --------------------------------------------------------------------
        // Convert the JSON string into a JavaScript array of objects
        // If the JSON is invalid, this will throw an error
        return JSON.parse(cleanText);

    } catch (error) {
        // If anything goes wrong (network error, invalid JSON, etc.),
        // log the error and re-throw it so the calling code can handle it
        console.error("Error generating script with Gemini:", error);
        throw error;
    }
}

// ============================================================================
// FUNCTION 2: Generate Image from Text Description
// ============================================================================
// This function takes a text description (like "a robot in a garden")
// and uses Hugging Face's Stable Diffusion model to generate an image.
//
// Input: A string describing what the image should show
// Output: A base64-encoded image string (data:image/jpeg;base64,...)
//         that can be directly used in an <img> tag's src attribute

async function generateImage(prompt) {
    // ------------------------------------------------------------------------
    // Step 2.1: Determine which AI model to use
    // ------------------------------------------------------------------------
    // Check if a specific model is set in .env (HF_MODEL_ID)
    // If not, use the default: Stable Diffusion XL
    const modelId = process.env.HF_MODEL_ID || "stabilityai/stable-diffusion-xl-base-1.0";

    // Get the API key and remove any accidental whitespace
    // The ?. operator means "only call .trim() if HF_API_KEY exists"
    const token = process.env.HF_API_KEY?.trim();

    // ------------------------------------------------------------------------
    // Step 2.2: Check if we have the required API key
    // ------------------------------------------------------------------------
    if (!token) {
        throw new Error("HF_API_KEY is missing. Check your environment variables.");
    }

    try {
        // --------------------------------------------------------------------
        // Step 2.3: Make HTTP POST request to Hugging Face
        // --------------------------------------------------------------------
        // We use axios to send a POST request to Hugging Face's inference API
        const response = await axios.post(
            // The URL includes the specific model we want to use
            `https://router.huggingface.co/hf-inference/models/${modelId}`,

            // The request body contains our text prompt
            { inputs: prompt },

            // Configuration options for the request
            {
                headers: {
                    // Authentication: Our API key
                    Authorization: `Bearer ${token}`,

                    // We want the response to be a PNG image
                    "Accept": "image/png"
                },

                // Tell axios to expect binary data (the image file)
                // instead of text/JSON
                responseType: "arraybuffer",
            }
        );

        // --------------------------------------------------------------------
        // Step 2.4: Convert the binary image data to base64
        // --------------------------------------------------------------------
        // The response.data contains the raw image bytes
        // We convert it to base64 so it can be embedded in HTML/JSON
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');

        // Return the image as a data URL that can be used directly in <img src="">
        return `data:image/jpeg;base64,${base64Image}`;

    } catch (error) {
        // --------------------------------------------------------------------
        // Step 2.5: Handle errors with helpful messages
        // --------------------------------------------------------------------
        // Create a user-friendly error message
        let errorMessage = `Image generation failed (${modelId})`;

        // If we got a response from the server, check the status code
        if (error.response) {
            const status = error.response.status;

            // 402: Payment Required - the model requires a paid subscription
            if (status === 402) {
                errorMessage = `Hugging Face API Error: 402 Payment Required for model ${modelId}.`;
            }
            // 401: Unauthorized - the API key is invalid or expired
            else if (status === 401) {
                errorMessage = `Hugging Face API Error: 401 Unauthorized. Your HF_API_KEY is invalid.`;
            }
            // 429: Too Many Requests - we've hit the rate limit
            else if (status === 429) {
                errorMessage = "Hugging Face API Error: 429 Too Many Requests.";
            }
            // Any other HTTP error
            else {
                errorMessage = `Hugging Face API Error: ${status} - ${error.message}`;
            }
        }
        // If we couldn't connect to the server at all
        else {
            errorMessage = `Error connecting to Hugging Face: ${error.message}`;
        }

        // Log the error to the console for debugging
        console.error(errorMessage);

        // Throw the error so the calling code knows something went wrong
        throw new Error(errorMessage);
    }
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================
// Make these functions available to other files via import
export { generateScript, generateImage };
