import axios from "axios";

export async function getAIResponse(userInput) {
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/chat`, { userInput });
    return response.data.reply;
  } catch (error) {
    console.error("Error getting AI response:", error.response?.data || error.message);
    return "Sorry, something went wrong.";
  }
}
