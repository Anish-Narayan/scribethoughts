// src/CopingStrategies.js

export const copingStrategies = {
  sadness: [
    { title: "Reach Out", description: "Connect with a friend or family member. Sharing your feelings can lighten the burden." },
    { title: "Mindful Observation", description: "Sit with your sadness for a few minutes without judgment. Acknowledge it like a passing cloud." },
    { title: "Engage Your Senses", description: "Listen to uplifting music, light a scented candle, or wrap yourself in a soft blanket." }
  ],
  anger: [
    { title: "Deep Breathing", description: "Inhale slowly for 4 seconds, hold for 4, and exhale for 6. Repeat until you feel calmer." },
    { title: "Physical Release", description: "Go for a brisk walk, do some quick exercise, or squeeze a stress ball to release pent-up energy." },
    { title: "Write It Out", description: "On a piece of paper (or here!), write down everything you're angry about, then safely discard it." }
  ],
  fear: [
    { title: "Grounding Technique", description: "Name 5 things you can see, 4 things you can touch, 3 things you can hear, 2 you can smell, and 1 you can taste." },
    { title: "Fact-Check Your Thoughts", description: "Challenge your fearful thoughts. Ask yourself: What is the evidence for this? What is a more likely outcome?" },
    { title: "Comforting Self-Talk", description: "Speak to yourself like you would a dear friend. Say things like, 'This feeling is temporary,' or 'I am safe right now.'" }
  ],
  joy: [
    { title: "Savor the Moment", description: "Take a few minutes to fully experience this positive feeling. Notice how it feels in your body." },
    { title: "Express Gratitude", description: "Think of or write down three things you are grateful for right now, big or small." },
    { title: "Share the Good News", description: "Share your positive experience with someone else to amplify the feeling of joy." }
  ],
  love: [
    { title: "Savor the Moment", description: "Take a few minutes to fully experience this positive feeling. Notice how it feels in your body." },
    { title: "Express Gratitude", description: "Think of or write down three things you are grateful for right now, big or small." },
    { title: "Share the Good News", description: "Share your positive experience with someone else to amplify the feeling of joy." }
  ],
  // A default set for other emotions or when no specific match is found
  default: [
    { title: "Mindful Check-In", description: "Take a moment to notice your breath and how your body feels without needing to change anything." },
    { title: "Quick Stretch", description: "Stand up and stretch your arms overhead. Roll your shoulders and neck gently to release tension." },
    { title: "Step Outside", description: "Even 30 seconds of fresh air can help reset your perspective and change your environment." }
  ]
};