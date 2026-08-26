"""HTTPリクエストハンドラの実装"""

from http.server import SimpleHTTPRequestHandler
from pathlib import Path
from typing import Optional
import logging
import urllib.parse
import os

from .config import ServerConfig, RouteConfig


logger = logging.getLogger(__name__)


class StaticFileHandler(SimpleHTTPRequestHandler):
    """
    複数ルート設定に対応した静的ファイル配信ハンドラ
    
    ServerConfigで定義されたルート設定に基づいて、リクエストパスを
    適切なファイルシステムパスにマッピングして配信します。
    """
    
    # クラス変数として設定を保持
    server_config: ServerConfig | None = None
    
    def __init__(self, *args, **kwargs):
        """ハンドラの初期化"""
        if self.server_config is None:
            raise RuntimeError("ServerConfig must be set before creating handler instances")
        super().__init__(*args, **kwargs)
    
    def translate_path(self, path: str) -> str:
        """
        リクエストパスをファイルシステムパスに変換
        
        Args:
            path: リクエストパス（例: /api/index.html）
            
        Returns:
            str: ファイルシステム上の絶対パス
        """
        # URLデコード
        path = urllib.parse.unquote(path)
        
        # クエリパラメータを除去
        path = path.split('?', 1)[0]
        path = path.split('#', 1)[0]
        
        # 正規化（セキュリティ対策）
        # path.normpath を使用して .. などを処理
        path = path.rstrip('/')
        
        logger.debug(f"Translating path: {path}")
        
        # ルート設定を走査してマッチするものを探す
        matched_route = self._find_matching_route(path)
        
        if matched_route is None:
            logger.info(f"No matching route for path: {path}")
            return ""  # マッチしない場合は空文字列を返す（404になる）
        
        # マッチしたルートに基づいてファイルパスを解決
        file_path = self._resolve_file_path(path, matched_route)
        
        if file_path and file_path.exists():
            logger.info(f"Resolved path: {path} -> {file_path}")
            return str(file_path)
        else:
            logger.info(f"Path not found: {path} (resolved to {file_path})")
            return str(file_path) if file_path else ""
    
    def _find_matching_route(self, path: str) -> Optional[RouteConfig]:
        """
        リクエストパスにマッチするルート設定を探す
        
        Args:
            path: リクエストパス
            
        Returns:
            Optional[RouteConfig]: マッチしたルート設定、なければNone
        """
        assert self.server_config is not None, "server_config must be set"
        
        # ルートリストを長い順にソート（より具体的なルートを優先）
        sorted_routes = sorted(
            self.server_config.routes,
            key=lambda r: len(r.route),
            reverse=True
        )
        
        for route_config in sorted_routes:
            route_path = route_config.route.rstrip('/')
            request_path = path.rstrip('/')
            
            # 完全一致または前方一致（次の文字が/）
            if request_path == route_path:
                logger.debug(f"Exact match: {path} matches route {route_config.route}")
                return route_config
            elif request_path.startswith(route_path + '/'):
                logger.debug(f"Prefix match: {path} matches route {route_config.route}")
                return route_config
        
        return None
    
    def _resolve_file_path(self, request_path: str, route_config: RouteConfig) -> Optional[Path]:
        """
        ルート設定に基づいてファイルパスを解決
        
        Args:
            request_path: リクエストパス
            route_config: マッチしたルート設定
            
        Returns:
            Optional[Path]: 解決されたファイルパス
        """
        assert self.server_config is not None, "server_config must be set"
        
        # ディレクトリパスを解決
        dir_path = Path(route_config.dir)
        if not dir_path.is_absolute():
            dir_path = self.server_config.base_dir / dir_path
        
        # dirが単一ファイルの場合
        if dir_path.is_file():
            logger.debug(f"Route points to a single file: {dir_path}")
            return dir_path
        
        # dirがディレクトリの場合
        if not dir_path.is_dir():
            logger.warning(f"Route directory does not exist: {dir_path}")
            return None
        
        # リクエストパスからルートプレフィックスを除去
        route_path = route_config.route.rstrip('/')
        relative_path = request_path[len(route_path):].lstrip('/')
        
        # 相対パスが空の場合（ルートそのもの）
        if not relative_path:
            # index.htmlを探す
            index_path = dir_path / "index.html"
            if index_path.exists():
                logger.debug(f"Serving index.html for directory: {dir_path}")
                return index_path
            else:
                # ディレクトリリスティングを許可（SimpleHTTPRequestHandlerのデフォルト動作）
                logger.debug(f"Serving directory listing: {dir_path}")
                return dir_path
        
        # セキュリティチェック: ../ などでディレクトリ外にアクセスしようとしていないか確認
        full_path = (dir_path / relative_path).resolve()
        
        try:
            # full_pathがdir_pathの配下にあることを確認
            full_path.relative_to(dir_path.resolve())
        except ValueError:
            logger.warning(f"Security violation: Attempt to access outside directory: {full_path}")
            return None
        
        # ディレクトリの場合はindex.htmlを探す
        if full_path.is_dir():
            index_path = full_path / "index.html"
            if index_path.exists():
                logger.debug(f"Serving index.html for directory: {full_path}")
                return index_path
            else:
                # ディレクトリリスティング
                logger.debug(f"Serving directory listing: {full_path}")
                return full_path
        
        return full_path
    
    def do_GET(self):
        """GETリクエストの処理"""
        logger.info(f"GET {self.path}")
        
        # translate_pathが空文字列を返した場合は404
        translated = self.translate_path(self.path)
        if not translated:
            self.send_error(404, "File not found")
            return
        
        # 親クラスのdo_GETを呼び出して実際のファイル配信を行う
        super().do_GET()
    
    def do_HEAD(self):
        """HEADリクエストの処理"""
        logger.info(f"HEAD {self.path}")
        
        # translate_pathが空文字列を返した場合は404
        translated = self.translate_path(self.path)
        if not translated:
            self.send_error(404, "File not found")
            return
        
        super().do_HEAD()
    
    def log_message(self, format: str, *args):
        """
        ログメッセージの出力
        
        SimpleHTTPRequestHandlerのデフォルトログをロガーにリダイレクト
        """
        logger.info(f"{self.address_string()} - {format % args}")
    
    def log_error(self, format: str, *args):
        """エラーログの出力"""
        logger.error(f"{self.address_string()} - {format % args}")


def create_handler(config: ServerConfig):
    """
    設定を持つハンドラクラスを生成
    
    Args:
        config: サーバー設定
        
    Returns:
        type: 設定済みのハンドラクラス
    """
    # ハンドラクラスに設定を注入
    StaticFileHandler.server_config = config
    return StaticFileHandler
