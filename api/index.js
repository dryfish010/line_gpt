const { Client } = require("@line/bot-sdk");
const { Configuration, OpenAIApi } = require("openai");

// OpenAI 配置
const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // 請確保在 Vercel 的環境變數中設置 OPENAI_API_KEY
  })
);

// LINE 配置
const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN, // 環境變數設定
  channelSecret: process.env.LINE_CHANNEL_SECRET,           // 環境變數設定
});

// 主函數，處理 LINE 的 Webhook 請求
module.exports = async (req, res) => {
  try {
    // 檢查是否為 POST 方法
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    // 取得事件資料
    const events = req.body.events;

    // 如果沒有事件，直接返回
    if (!events || events.length === 0) {
      return res.status(200).send("No events");
    }

    // 遍歷所有事件
    for (const event of events) {
      // 確認是文字消息
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text; // 使用者的輸入

        try {
          // 呼叫 OpenAI 的 GPT-4 模型生成回應
          const completion = await openai.createChatCompletion({
            model: "gpt-4",
            messages: [{ role: "user", content: userMessage }],
          });

          const reply = completion.data.choices[0].message.content;

          // 回應 LINE 使用者
          await lineClient.replyMessage(event.replyToken, {
            type: "text",
            text: reply,
          });
        } catch (error) {
          console.error("OpenAI 或 LINE 回應錯誤:", error.message);
          console.error(error.response?.data || error.stack);

          // 發送錯誤訊息給使用者
          await lineClient.replyMessage(event.replyToken, {
            type: "text",
            text: "抱歉，我無法回應您的訊息。",
          });
        }
      }
    }

    // 成功處理請求
    res.status(200).send("OK");
  } catch (error) {
    console.error("伺服器錯誤:", error.message);
    console.error(error.stack);
    res.status(500).send("Internal Server Error");
  }
};
