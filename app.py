import os
import json
import requests
from flask import Flask, request, abort
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import TextMessage, TextSendMessage

# 初始化 Flask 應用
app = Flask(__name__)

# LINE Bot API 和 Webhook handler 設定
LINE_CHANNEL_ACCESS_TOKEN = os.getenv('LINE_CHANNEL_ACCESS_TOKEN')
LINE_CHANNEL_SECRET = os.getenv('LINE_CHANNEL_SECRET')

line_bot_api = LineBotApi(LINE_CHANNEL_ACCESS_TOKEN)
handler = WebhookHandler(LINE_CHANNEL_SECRET)

# OpenAI API 密鑰
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# 設定 Webhook 路徑
@app.route("/callback", methods=['POST'])
def callback():
    signature = request.headers['X-Line-Signature']
    body = request.get_data(as_text=True)

    # 驗證 LINE 訊息的有效性
    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        abort(400)
    return 'OK'

# 設定處理訊息的函數
@handler.add(MessageEvent, message=TextMessage)
def handle_message(event):
    user_message = event.message.text

    # 呼叫 OpenAI API 生成回應
    gpt_response = get_gpt_response(user_message)

    # 回應 LINE 用戶
    line_bot_api.reply_message(
        event.reply_token,
        TextSendMessage(text=gpt_response)
    )

# 呼叫 OpenAI API 來生成回應
def get_gpt_response(prompt):
    prompt = f"請僅回答與社交工程相關的問題。以下是使用者的問題：\n\n{prompt}"

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
    }

    data = {
        "model": "text-davinci-003",  # 您可以選擇使用其他模型
        "prompt": prompt,
        "max_tokens": 1000,  # 可以根據需要調整回應的字數
        "temperature": 0.7,   # 控制回答的隨機性
    }

    response = requests.post('https://api.openai.com/v1/completions', headers=headers, json=data)
    response_data = response.json()

    # 返回生成的回應
    return response_data['choices'][0]['text'].strip()

# 啟動 Flask 應用程式
if __name__ == "__main__":
    app.run(debug=True, port=5000)
