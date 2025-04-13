import axios from "axios";

// ✅ Reads from .env.development (Vue CLI style)
const baseURL = process.env.VUE_APP_API_URL;

export async function getAIResponse(userInput, imageUrl = null, lessonId = null) {
  console.log("🟣 GPTService called with:");
  console.log("→ baseURL:", baseURL);
  console.log("→ userInput:", userInput);
  console.log("→ imageUrl:", imageUrl);
  console.log("→ lessonId:", lessonId);

  const url = `${baseURL}/chat`;
  console.log("🟣 Full POST URL:", url);

  try {
    const response = await axios.post(url, {
      userInput,
      imageUrl,
      lessonId
    });

    console.log("✅ AI Response received:", response.data);
    return response.data.reply;
  } catch (error) {
    if (error.response) {
      console.error("❌ Backend responded with error:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("❌ No response received from backend:", error.request);
    } else {
      console.error("❌ Unexpected error:", error.message);
    }

    return "Произошла ошибка при получении ответа от AI.";
  }
}
