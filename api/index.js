const { Client } = require("@line/bot-sdk");
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // 替換為您的 OpenAI API 密鑰
  });
  


const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN, // 設置在 Vercel 的環境變數
  channelSecret: process.env.LINE_CHANNEL_SECRET,           // 設置在 Vercel 的環境變數
};

const lineClient = new Client(lineConfig);

const openaiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // OpenAI 的 API 密鑰
});

const openai = new OpenAIApi(openaiConfig);

module.exports = async (req, res) => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }
  
      const events = req.body.events;
  
      if (!events || events.length === 0) {
        return res.status(200).send("No events");
      }
  
      for (const event of events) {
        if (event.type === "message" && event.message.type === "text") {
          const userMessage = event.message.text;
  
          try {
            const completion = await openai.createChatCompletion({
              model: "gpt-4",
              messages: [{ role: "user", content: userMessage }],
            });
  
            const reply = completion.data.choices[0].message.content;
  
            await lineClient.replyMessage(event.replyToken, {
              type: "text",
              text: reply,
            });
          } catch (error) {
            console.error("Error generating reply:", error);
            await lineClient.replyMessage(event.replyToken, {
              type: "text",
              text: "抱歉，我無法回應您的消息。",
            });
          }
        }
      }
  
      res.status(200).send("OK");
    } catch (error) {
      console.error("Unexpected error:", error); // 日誌輸出錯誤
      res.status(500).send("Internal Server Error");
    }
  };
