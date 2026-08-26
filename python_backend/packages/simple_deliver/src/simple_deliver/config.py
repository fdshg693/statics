"""設定ファイルの読み込みと解析を行うモジュール"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Any
import yaml


@dataclass
class RouteConfig:
    """ルート設定を表すデータクラス"""
    route: str
    dir: str
    
    def __post_init__(self):
        """初期化後のバリデーション"""
        if not self.route:
            raise ValueError("route must not be empty")
        if not self.dir:
            raise ValueError("dir must not be empty")
        
        # routeが/で始まることを確認
        if not self.route.startswith("/"):
            self.route = f"/{self.route}"


@dataclass
class ServerConfig:
    """サーバー設定を表すデータクラス"""
    port: int = 8000
    base_dir: Path = field(default_factory=Path.cwd)
    routes: List[RouteConfig] = field(default_factory=list)
    
    def __post_init__(self):
        """初期化後のバリデーション"""
        # base_dirをPathオブジェクトに変換
        if isinstance(self.base_dir, str):
            self.base_dir = Path(self.base_dir)
        
        # base_dirが絶対パスであることを確認
        if not self.base_dir.is_absolute():
            raise ValueError(f"base_dir must be an absolute path: {self.base_dir}")
        
        # base_dirが存在することを確認
        if not self.base_dir.exists():
            raise ValueError(f"base_dir does not exist: {self.base_dir}")
        
        # portの範囲をチェック
        if not (1 <= self.port <= 65535):
            raise ValueError(f"port must be between 1 and 65535: {self.port}")


class ConfigError(Exception):
    """設定ファイルに関連するエラー"""
    pass


def load_config(config_path: str | Path) -> ServerConfig:
    """
    YAML設定ファイルを読み込み、ServerConfigオブジェクトを返す
    
    Args:
        config_path: 設定ファイルのパス
        
    Returns:
        ServerConfig: 解析された設定
        
    Raises:
        ConfigError: 設定ファイルの読み込みまたは解析に失敗した場合
    """
    config_path = Path(config_path)
    
    # ファイルの存在確認
    if not config_path.exists():
        raise ConfigError(f"Config file not found: {config_path}")
    
    if not config_path.is_file():
        raise ConfigError(f"Config path is not a file: {config_path}")
    
    # YAMLファイルの読み込み
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
    except yaml.YAMLError as e:
        raise ConfigError(f"Failed to parse YAML: {e}") from e
    except Exception as e:
        raise ConfigError(f"Failed to read config file: {e}") from e
    
    if not isinstance(data, dict):
        raise ConfigError("Config file must contain a YAML mapping (dict)")
    
    # 設定の解析
    try:
        config = _parse_config(data)
        return config
    except (ValueError, KeyError) as e:
        raise ConfigError(f"Invalid config structure: {e}") from e


def _parse_config(data: Dict[str, Any]) -> ServerConfig:
    """
    辞書形式の設定データをServerConfigオブジェクトに変換
    
    Args:
        data: YAML から読み込んだ辞書データ
        
    Returns:
        ServerConfig: 解析された設定
    """
    # 基本設定の取得
    port = data.get("port", 8000)
    base_dir = data.get("base_dir")
    
    if base_dir is None:
        raise ValueError("base_dir is required in config")
    
    # ルート設定の解析
    routes = []
    for key, value in data.items():
        # 数値キーをチェック（1, 2, 3...）
        if isinstance(key, int) or (isinstance(key, str) and key.isdigit()):
            if not isinstance(value, dict):
                raise ValueError(f"Route config at key '{key}' must be a mapping")
            
            route = value.get("route")
            dir_path = value.get("dir")
            
            if route is None:
                raise ValueError(f"'route' is required in route config at key '{key}'")
            if dir_path is None:
                raise ValueError(f"'dir' is required in route config at key '{key}'")
            
            routes.append(RouteConfig(route=route, dir=dir_path))
    
    # ServerConfigオブジェクトの作成
    config = ServerConfig(
        port=port,
        base_dir=base_dir,
        routes=routes
    )
    
    return config


def validate_routes(config: ServerConfig) -> None:
    """
    ルート設定の追加バリデーションを実行
    
    Args:
        config: 検証するサーバー設定
        
    Raises:
        ConfigError: バリデーションに失敗した場合
    """
    for route_config in config.routes:
        # dirが相対パスの場合、base_dirからの絶対パスを構築
        dir_path = Path(route_config.dir)
        
        if not dir_path.is_absolute():
            full_path = config.base_dir / dir_path
        else:
            full_path = dir_path
        
        # パスの存在確認
        if not full_path.exists():
            raise ConfigError(
                f"Path does not exist for route '{route_config.route}': {full_path}"
            )
