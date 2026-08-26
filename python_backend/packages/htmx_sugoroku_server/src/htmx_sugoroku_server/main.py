from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import random
import uuid
from util.path import find_code_root

# 静的ファイルのパスを設定
code_root = find_code_root()
STATIC_FILES_DIR = code_root / 'StaticApps' / 'apps' / 'htmx_sugoroku'
CDN_RESOURCES_DIR = code_root / 'StaticApps' / 'cdn_resources'

app = Flask(__name__)
CORS(app)

# ゲームデータを保存する辞書
games = {}
BOARD_SIZE = 30


@app.route('/api/game/start', methods=['POST'])
def start_game():
    """新しいゲームを開始する"""
    game_id = str(uuid.uuid4())
    games[game_id] = {
        'position': 0,
        'board_size': BOARD_SIZE
    }
    return jsonify({
        'game_id': game_id,
        'position': 0,
        'board_size': BOARD_SIZE,
        'message': 'ゲームを開始しました！'
    })


@app.route('/api/game/roll', methods=['POST'])
def roll_dice():
    """サイコロを振って、コマを進める"""
    data = request.json
    game_id = data.get('game_id')
    current_position = data.get('current_position', 0)
    
    if game_id not in games:
        return jsonify({'error': 'ゲームが見つかりません'}), 404
    
    # 1-6のランダムなサイコロを振る
    dice = random.randint(1, 6)
    
    # 新しい位置を計算（ゴールを超えない）
    new_position = min(current_position + dice, BOARD_SIZE)
    
    # ゴール判定
    is_finished = new_position >= BOARD_SIZE
    
    # ゲーム状態を更新
    games[game_id]['position'] = new_position
    
    # メッセージを生成
    message = f'サイコロは{dice}が出ました！'
    if is_finished:
        message += ' おめでとうございます、ゴールです！'
    
    return jsonify({
        'dice': dice,
        'new_position': new_position,
        'is_finished': is_finished,
        'message': message
    })


@app.route('/api/game/status', methods=['GET'])
def game_status():
    """現在のゲーム状態を取得する"""
    game_id = request.args.get('game_id')
    
    if game_id not in games:
        return jsonify({'error': 'ゲームが見つかりません'}), 404
    
    game = games[game_id]
    return jsonify({
        'game_id': game_id,
        'position': game['position'],
        'board_size': game['board_size'],
        'is_finished': game['position'] >= game['board_size']
    })


@app.route('/', methods=['GET'])
def index():
    """ゲームのメインページを配信"""
    return send_from_directory(STATIC_FILES_DIR, 'index.html')


@app.route('/style.css', methods=['GET'])
def style():
    """CSSファイルを配信"""
    return send_from_directory(STATIC_FILES_DIR, 'style.css')


@app.route('/cdn_resources/<path:filename>', methods=['GET'])
def cdn_resources(filename):
    """CDNリソース（htmx.min.jsなど）を配信"""
    return send_from_directory(CDN_RESOURCES_DIR, filename)


@app.route('/info', methods=['GET'])
def info():
    """サーバー情報"""
    return jsonify({
        'message': 'すごろくゲーム バックエンドサーバー',
        'endpoints': {
            'start': 'POST /api/game/start',
            'roll': 'POST /api/game/roll',
            'status': 'GET /api/game/status?game_id={game_id}'
        }
    })


def main():
    app.run(debug=True, port=5000, host='0.0.0.0')


if __name__ == '__main__':
    main()
