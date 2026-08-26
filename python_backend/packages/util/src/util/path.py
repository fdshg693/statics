# 親ディレクトリを遡っていき、cdn_resources を子に持つ最も近い祖先(=リポジトリルート)を返す

from pathlib import Path


def find_repo_root() -> Path:
    """
    親ディレクトリを遡っていき、cdn_resources ディレクトリを直下に持つ
    最も近い祖先ディレクトリ(リポジトリルート)を見つけて返す

    Returns:
        Path: リポジトリルートの絶対パス

    Raises:
        FileNotFoundError: リポジトリルートが見つからない場合
    """
    current_path = Path(__file__).resolve()

    for parent in [current_path] + list(current_path.parents):
        if (parent / "cdn_resources").is_dir():
            return parent

    raise FileNotFoundError("cdn_resources を子に持つリポジトリルートが見つかりません")
