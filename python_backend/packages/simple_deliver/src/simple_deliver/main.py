"""
設定ファイルを元に静的ファイルを配信するシンプルなサーバー

Usage:
    simple_deliver <config_file> [--verbose|-v]

設定ファイル例: simple_deliver_config.yaml
```yaml
port: 8000
base_dir: absolute/path/to/served/files
1:
  route: /static
  dir: relative/path/to/static/
2:
  route: /assets
  dir: relative/path/to/assets/
3:
  route: /
  dir: relative/path/to/single_file.html
```
"""

import argparse
import logging
import sys
from pathlib import Path

from .config import load_config, validate_routes, ConfigError
from .server import start_server


# ロガーの設定
logger = logging.getLogger(__name__)


def setup_logging(verbose: bool = False):
    """
    ログレベルを設定
    
    Args:
        verbose: Trueの場合、DEBUGレベルに設定
    """
    level = logging.DEBUG if verbose else logging.INFO
    
    # ルートロガーの設定
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )


def parse_args():
    """
    コマンドライン引数を解析
    
    Returns:
        argparse.Namespace: 解析された引数
    """
    parser = argparse.ArgumentParser(
        description="Simple static file server with configurable routes",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Example:
  simple_deliver config.yaml
  simple_deliver config.yaml --verbose
  simple_deliver /path/to/config.yaml -v
        """
    )
    
    parser.add_argument(
        "config_file",
        type=str,
        help="Path to the YAML configuration file"
    )
    
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose logging (DEBUG level)"
    )
    
    return parser.parse_args()


def main():
    """
    メインエントリポイント
    
    Returns:
        int: 終了コード（0: 成功、1: エラー）
    """
    # コマンドライン引数の解析
    args = parse_args()
    
    # ログの設定
    setup_logging(verbose=args.verbose)
    
    try:
        # 設定ファイルの読み込み
        logger.info(f"Loading config from: {args.config_file}")
        config = load_config(args.config_file)
        
        # ルート設定のバリデーション
        logger.info("Validating routes...")
        validate_routes(config)
        
        # サーバーの起動
        logger.info("Starting server...")
        start_server(config)
        
        return 0
        
    except ConfigError as e:
        logger.error(f"Configuration error: {e}")
        return 1
    
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
        return 0
    
    except OSError as e:
        logger.error(f"OS error: {e}")
        return 1
    
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())