"""HTTPサーバーの起動と管理を行うモジュール"""

from http.server import ThreadingHTTPServer
import logging
import signal
import socket
import sys
from typing import Optional

from .config import ServerConfig
from .handler import create_handler


logger = logging.getLogger(__name__)


class ServerManager:
    """
    HTTPサーバーのライフサイクルを管理するクラス
    """
    
    def __init__(self, config: ServerConfig):
        """
        サーバーマネージャーの初期化
        
        Args:
            config: サーバー設定
        """
        self.config = config
        self.server: Optional[ThreadingHTTPServer] = None
        self._shutdown_requested = False
    
    def _setup_signal_handlers(self):
        """
        シグナルハンドラの設定（グレースフルシャットダウン用）
        
        Windows環境では、シグナルハンドラ内でshutdown()を呼び出すとデッドロックする
        可能性があるため、SIGINT (Ctrl+C)はデフォルトのハンドラに任せ、
        KeyboardInterruptとして処理する。
        """
        # Windowsでは、Ctrl+Cは自動的にKeyboardInterruptを発生させるため、
        # 明示的なSIGINTハンドラは設定しない
        if sys.platform != 'win32':
            # Unix系OSの場合のみSIGTERMハンドラを設定
            def signal_handler(signum, frame):
                logger.info("Shutdown signal received. Shutting down gracefully...")
                self._shutdown_requested = True
                if self.server:
                    self.server.shutdown()
            
            signal.signal(signal.SIGTERM, signal_handler)
    
    def _log_server_info(self):
        """サーバー起動情報をログ出力"""
        logger.info("=" * 60)
        logger.info(f"Server started successfully")
        logger.info(f"Host: 0.0.0.0")
        logger.info(f"Port: {self.config.port}")
        logger.info(f"Base directory: {self.config.base_dir}")
        logger.info(f"Access URL: http://localhost:{self.config.port}")
        logger.info("-" * 60)
        logger.info("Routes:")
        
        if not self.config.routes:
            logger.info("  (No routes configured)")
        else:
            for route in self.config.routes:
                logger.info(f"  {route.route} -> {route.dir}")
        
        logger.info("=" * 60)
        logger.info("Press Ctrl+C to stop the server")
    
    def start(self):
        """
        サーバーを起動
        
        Raises:
            OSError: ポートが既に使用されている場合
            Exception: その他のサーバー起動エラー
        """
        try:
            # ハンドラクラスの作成
            handler_class = create_handler(self.config)
            
            # サーバーの作成
            server_address = ("", self.config.port)
            self.server = ThreadingHTTPServer(server_address, handler_class)
            
            # ワーカースレッドをデーモン化してCtrl+Cで即座に終了できるようにする
            self.server.daemon_threads = True
            
            # タイムアウトを設定してKeyboardInterruptを適切にキャッチできるようにする
            self.server.timeout = 0.5
            
            # シグナルハンドラの設定
            self._setup_signal_handlers()
            
            # サーバー情報の出力
            self._log_server_info()
            
            # サーバーの起動（ブロッキング）
            # タイムアウトを設定しているので、定期的にKeyboardInterruptをチェックできる
            while not self._shutdown_requested:
                self.server.handle_request()
            
        except OSError as e:
            if e.errno == 48 or e.errno == 10048:  # macOS/Linux: 48, Windows: 10048
                logger.error(f"Port {self.config.port} is already in use")
                logger.error("Please try a different port or stop the process using this port")
                raise OSError(f"Port {self.config.port} is already in use") from e
            else:
                logger.error(f"Failed to bind to port {self.config.port}: {e}")
                raise
        except KeyboardInterrupt:
            # Ctrl+Cによる中断（グレースフルシャットダウン）
            logger.info("Keyboard interrupt received. Shutting down...")
            self._shutdown_requested = True
        except Exception as e:
            logger.error(f"Server error: {e}", exc_info=True)
            raise
        finally:
            self._cleanup()
    
    def _cleanup(self):
        """サーバーのクリーンアップ"""
        if self.server:
            logger.info("Shutting down server...")
            try:
                self.server.server_close()
                logger.info("Server stopped successfully")
            except Exception as e:
                logger.error(f"Error during server cleanup: {e}")


def start_server(config: ServerConfig):
    """
    HTTPサーバーを起動
    
    この関数はブロッキングで、サーバーが停止するまで戻りません。
    Ctrl+Cでグレースフルシャットダウンが可能です。
    
    Args:
        config: サーバー設定
        
    Raises:
        OSError: ポートが既に使用されている場合
        Exception: サーバー起動時のエラー
        
    Example:
        >>> from simple_deliver.config import ServerConfig, RouteConfig
        >>> config = ServerConfig(
        ...     port=8000,
        ...     base_dir=Path("/path/to/base"),
        ...     routes=[RouteConfig(route="/app", dir="./app")]
        ... )
        >>> start_server(config)
    """
    manager = ServerManager(config)
    manager.start()
