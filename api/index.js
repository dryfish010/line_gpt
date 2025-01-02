const { Client } = require("@line/bot-sdk");
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // �������z�� OpenAI API �K�_
  });
  


const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN, // �]�m�b Vercel �������ܼ�
  channelSecret: process.env.LINE_CHANNEL_SECRET,           // �]�m�b Vercel �������ܼ�
};

const lineClient = new Client(lineConfig);

const openaiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // OpenAI �� API �K�_
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
              text: "��p�A�ڵL�k�^���z�������C",
            });
          }
        }
      }
  
      res.status(200).send("OK");
    } catch (error) {
      console.error("Unexpected error:", error); // ��x��X���~
      res.status(500).send("Internal Server Error");
    }
  };
