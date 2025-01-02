const { Client } = require("@line/bot-sdk");
const { Configuration, OpenAIApi } = require("openai");

// OpenAI �t�m
const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // �нT�O�b Vercel �������ܼƤ��]�m OPENAI_API_KEY
  })
);

// LINE �t�m
const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN, // �����ܼƳ]�w
  channelSecret: process.env.LINE_CHANNEL_SECRET,           // �����ܼƳ]�w
});

// �D��ơA�B�z LINE �� Webhook �ШD
module.exports = async (req, res) => {
  try {
    // �ˬd�O�_�� POST ��k
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    // ���o�ƥ���
    const events = req.body.events;

    // �p�G�S���ƥ�A������^
    if (!events || events.length === 0) {
      return res.status(200).send("No events");
    }

    // �M���Ҧ��ƥ�
    for (const event of events) {
      // �T�{�O��r����
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text; // �ϥΪ̪���J

        try {
          // �I�s OpenAI �� GPT-4 �ҫ��ͦ��^��
          const completion = await openai.createChatCompletion({
            model: "gpt-4",
            messages: [{ role: "user", content: userMessage }],
          });

          const reply = completion.data.choices[0].message.content;

          // �^�� LINE �ϥΪ�
          await lineClient.replyMessage(event.replyToken, {
            type: "text",
            text: reply,
          });
        } catch (error) {
          console.error("OpenAI �� LINE �^�����~:", error.message);
          console.error(error.response?.data || error.stack);

          // �o�e���~�T�����ϥΪ�
          await lineClient.replyMessage(event.replyToken, {
            type: "text",
            text: "��p�A�ڵL�k�^���z���T���C",
          });
        }
      }
    }

    // ���\�B�z�ШD
    res.status(200).send("OK");
  } catch (error) {
    console.error("���A�����~:", error.message);
    console.error(error.stack);
    res.status(500).send("Internal Server Error");
  }
};
