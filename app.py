import os
import json
import requests
from flask import Flask, request, abort
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import TextMessage, TextSendMessage

# ��l�� Flask ����
app = Flask(__name__)

# LINE Bot API �M Webhook handler �]�w
LINE_CHANNEL_ACCESS_TOKEN = os.getenv('LINE_CHANNEL_ACCESS_TOKEN')
LINE_CHANNEL_SECRET = os.getenv('LINE_CHANNEL_SECRET')

line_bot_api = LineBotApi(LINE_CHANNEL_ACCESS_TOKEN)
handler = WebhookHandler(LINE_CHANNEL_SECRET)

# OpenAI API �K�_
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# �]�w Webhook ���|
@app.route("/callback", methods=['POST'])
def callback():
    signature = request.headers['X-Line-Signature']
    body = request.get_data(as_text=True)

    # ���� LINE �T�������ĩ�
    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        abort(400)
    return 'OK'

# �]�w�B�z�T�������
@handler.add(MessageEvent, message=TextMessage)
def handle_message(event):
    user_message = event.message.text

    # �I�s OpenAI API �ͦ��^��
    gpt_response = get_gpt_response(user_message)

    # �^�� LINE �Τ�
    line_bot_api.reply_message(
        event.reply_token,
        TextSendMessage(text=gpt_response)
    )

# �I�s OpenAI API �ӥͦ��^��
def get_gpt_response(prompt):
    prompt = f"�жȦ^���P����u�{���������D�C�H�U�O�ϥΪ̪����D�G\n\n{prompt}"

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
    }

    data = {
        "model": "text-davinci-003",  # �z�i�H��ܨϥΨ�L�ҫ�
        "prompt": prompt,
        "max_tokens": 1000,  # �i�H�ھڻݭn�վ�^�����r��
        "temperature": 0.7,   # ����^�����H����
    }

    response = requests.post('https://api.openai.com/v1/completions', headers=headers, json=data)
    response_data = response.json()

    # ��^�ͦ����^��
    return response_data['choices'][0]['text'].strip()

# �Ұ� Flask ���ε{��
if __name__ == "__main__":
    app.run(debug=True, port=5000)
