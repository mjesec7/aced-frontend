import axios from "axios";

export async function getAIResponse(userInput) {
  try {
    const response = await axios.post("https://aced.railway.internal/api/chat", { userInput });
    return response.data.reply;
  } catch (error) {
    console.error("Error getting AI response:", error);
    return "Sorry, something went wrong.";
  }
}
