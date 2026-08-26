# 親ディレクトリを遡っていきCodeRootフォルダをみつけ、その絶対パスを返す

from pathlib import Path


def find_code_root() -> Path:
    """
    親ディレクトリを遡っていきCodeRootフォルダを見つけ、その絶対パスを返す
    
    Returns:
        Path: CodeRootフォルダの絶対パス
        
    Raises:
        FileNotFoundError: CodeRootフォルダが見つからない場合
    """
    current_path = Path(__file__).resolve()
    
    # 親ディレクトリを遡って検索
    for parent in [current_path] + list(current_path.parents):
        if parent.name == "CodeRoot":
            return parent
    
    raise FileNotFoundError("CodeRoot folder not found in parent directories")