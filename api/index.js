const { Configuration, OpenAIApi } = require("openai");

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // 請確保在 Vercel 環境變數中設置該值
});

const openai = new OpenAIApi(config);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).send("Message is required.");
  }

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4", // 或者使用其他支持的模型
      messages: [{ role: "user", content: message }],
    });

    const response = completion.data.choices[0].message.content;
    res.status(200).json({ response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong." });
  }
};
