import OpenAI from "openai"

const { Client } = require("@line/bot-sdk");
const { Configuration, OpenAIApi } = require("openai");

// 配置 OpenAI
const openaiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(openaiConfig);

// 配置 LINE
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const lineClient = new Client(lineConfig);

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
            model: "dall-e-3",
            messages: [{ role: "user", content: userMessage }],
          });

          const reply = completion.data.choices[0].message.content;

          await lineClient.replyMessage(event.replyToken, {
            type: "text",
            text: reply,
          });
        } catch (error) {
          console.error("Error generating reply:", error.message);
          console.error(error.response?.data || error.stack);

          await lineClient.replyMessage(event.replyToken, {
            type: "text",
            text: "抱歉，我無法回應您的消息。",
          });
        }
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Unexpected error:", error.message);
    console.error(error.stack);
    res.status(500).send("Internal Server Error");
  }
};
