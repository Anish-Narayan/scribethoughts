const API_URL = "http://localhost:5000/analyze";
export const analyzeJournal = async (text) => {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) throw new Error("Failed to analyze journal");

    return await res.json(); // { summary, emotion, alert }
  } catch (err) {
    console.error(err);
    return { summary: "", emotion: "neutral", alert: false };
  }
};
