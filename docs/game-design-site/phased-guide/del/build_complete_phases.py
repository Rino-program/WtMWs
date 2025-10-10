#!/usr/bin/env python3
"""
Complete Phase Builder
Generates comprehensive HTML content for Phases 3, 4, 5, and Bugfix
Based on ALL_PHASES_EXPANSION.md specifications
"""

import os
import sys

def get_header(phase_num, phase_title, phase_icon):
    """Generate HTML header for a phase page"""
    return f'''<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phase {phase_num}: {phase_title} - バーチャル水族館ゲーム開発ガイド</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="progress-indicator">
        <div class="progress-bar" id="progressBar"></div>
    </div>

    <header class="main-header">
        <div class="header-container">
            <div class="logo">
                <span class="logo-icon">🐠</span>
                <span class="logo-text">バーチャル水族館ゲーム</span>
            </div>
            <h1 class="header-title">Phase {phase_num}: {phase_title}</h1>
        </div>
    </header>

    <nav class="phase-navigation">
        <div class="nav-container">
            <button class="phase-btn" data-phase="overview">
                <span class="phase-icon">📖</span>
                <span class="phase-label">概要</span>
            </button>
            <button class="phase-btn" data-phase="phase0">
                <span class="phase-icon">🎯</span>
                <span class="phase-label">Phase 0<br>MVP</span>
            </button>
            <button class="phase-btn" data-phase="phase1">
                <span class="phase-icon">🏗️</span>
                <span class="phase-label">Phase 1<br>基本構造</span>
            </button>
            <button class="phase-btn" data-phase="phase2">
                <span class="phase-icon">⚙️</span>
                <span class="phase-label">Phase 2<br>ロジック</span>
            </button>
            <button class="phase-btn{"active" if phase_num == "3" else ""}" data-phase="phase3">
                <span class="phase-icon">💻</span>
                <span class="phase-label">Phase 3<br>UI</span>
            </button>
            <button class="phase-btn{"active" if phase_num == "4" else ""}" data-phase="phase4">
                <span class="phase-icon">📦</span>
                <span class="phase-label">Phase 4<br>データ</span>
            </button>
            <button class="phase-btn{"active" if phase_num == "5" else ""}" data-phase="phase5">
                <span class="phase-icon">✨</span>
                <span class="phase-label">Phase 5<br>追加機能</span>
            </button>
            <button class="phase-btn" data-phase="bugfix">
                <span class="phase-icon">🐛</span>
                <span class="phase-label">バグ対策</span>
            </button>
        </div>
    </nav>

    <main class="main-content">
        <section class="phase-section active">
            <div class="section-container">
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="title-icon">{phase_icon}</span>
                        Phase {phase_num}: {phase_title}
                    </h2>
                    <p class="section-subtitle">詳細実装ガイド - すべてのコードと説明を含む完全版</p>
                </div>
'''

def get_footer():
    """Generate HTML footer"""
    return '''
            </div>
        </section>
    </main>

    <footer class="main-footer">
        <div class="footer-container">
            <p>&copy; 2025 バーチャル水族館ゲーム開発ガイド</p>
            <p>段階的な開発で完璧なゲームを作りましょう！</p>
        </div>
    </footer>

    <script src="navigation.js"></script>
</body>
</html>
'''

def generate_phase3_content():
    """Generate complete Phase 3 content - UI Implementation"""
    return '''
                <!-- Phase連携：前フェーズで学んだこと -->
                <div class="content-card phase-connection">
                    <h3>🔄 Phase 2で学んだこと</h3>
                    <p>前フェーズで実装した内容を確認しましょう：</p>
                    <ul>
                        <li>✅ <strong>GameEngineクラス</strong> - ゲームロジックとシミュレーション</li>
                        <li>✅ <strong>simulate_day()</strong> - 1日の時間進行処理</li>
                        <li>✅ <strong>経済システム</strong> - 収入・支出の計算</li>
                        <li>✅ <strong>イベントシステム</strong> - ランダムイベントの生成と処理</li>
                        <li>✅ <strong>実績システム</strong> - 実績の判定と記録</li>
                    </ul>
                    <div class="alert alert-success">
                        <strong>🎯 Phase 3への橋渡し</strong><br>
                        これらのロジックを、プレイヤーが操作できる<strong>インターフェース</strong>に変換します！
                    </div>
                </div>

                <!-- このフェーズの目標 -->
                <div class="content-card">
                    <h3>🎯 このフェーズの目標</h3>
                    <p>Phase 3では、<strong>ユーザーインターフェース（UI）</strong>を実装します。プレイヤーが快適にゲームを操作できる、使いやすいコマンドラインインターフェースを作ります。</p>
                    
                    <div class="alert alert-info">
                        <strong>💡 Phase 3のポイント</strong><br>
                        Pythonの<code>cmd</code>モジュールを使用して、インタラクティブなコマンドラインインターフェースを作成します。
                        <code>colorama</code>と<code>tabulate</code>を使って、見やすく美しい表示を実現します。
                    </div>

                    <h4>達成すべきこと：</h4>
                    <ul>
                        <li>✅ CUIフレームワークの実装（cmdモジュール使用）</li>
                        <li>✅ 15個の基本コマンドの実装</li>
                        <li>✅ カラー出力とテーブルフォーマット</li>
                        <li>✅ ヘルプシステムと補完機能</li>
                        <li>✅ エラーハンドリング</li>
                        <li>✅ テストコードの作成</li>
                    </ul>

                    <div class="requirements-list">
                        <div class="requirement-item">
                            <span class="req-icon">⏰</span>
                            <div class="req-content">
                                <h4>所要時間</h4>
                                <p>約2〜3日（CUI実装 + コマンド追加 + 表示整備 + テスト）</p>
                            </div>
                        </div>
                        <div class="requirement-item">
                            <span class="req-icon">📚</span>
                            <div class="req-content">
                                <h4>必要な知識</h4>
                                <p>Python基礎、cmdモジュール、colorama、tabulate</p>
                            </div>
                        </div>
                        <div class="requirement-item">
                            <span class="req-icon">🔧</span>
                            <div class="req-content">
                                <h4>必要なツール</h4>
                                <p>Python 3.8以上、colorama、tabulate、pytest</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- プロジェクト構造の更新 -->
                <div class="content-card">
                    <h3><span class="step-number">ステップ 1</span>プロジェクト構造の更新</h3>
                    <p>Phase 2までの構造に、<strong>UIモジュール</strong>を追加します。</p>

                    <h4>📁 更新されたディレクトリ構造：</h4>
                    <div class="code-block">
                        <pre><code>virtual-aquarium/
├── models/              # Phase 1 - 基本クラス
│   ├── __init__.py
│   ├── fish.py         # Fishクラス
│   ├── tank.py         # Tankクラス
│   ├── aquarium.py     # Aquariumクラス
│   ├── equipment.py    # Equipment, Decorationクラス
│   └── items.py
├── logic/               # Phase 2 - ゲームロジック
│   ├── __init__.py
│   └── game_engine.py  # GameEngineクラス
├── ui/                  # Phase 3 - NEW! UIモジュール
│   ├── __init__.py
│   ├── cli.py          # コマンドラインインターフェース
│   └── display.py      # 表示ユーティリティ
├── data/                # Phase 4で使用（先に作成）
│   └── .gitkeep
├── tests/
│   ├── test_models.py  # Phase 1のテスト
│   ├── test_logic.py   # Phase 2のテスト
│   └── test_ui.py      # Phase 3のテスト - NEW!
├── main.py              # メインエントリポイント（更新）
└── requirements.txt     # 更新: colorama, tabulate追加
</code></pre>
                    </div>

                    <div class="alert alert-info">
                        <strong>💡 構造のポイント</strong><br>
                        UIモジュールを独立させることで、将来的にGUIやWebインターフェースへの拡張も容易になります。
                    </div>

                    <h4>🖥️ セットアップコマンド：</h4>
                    <div class="code-block">
                        <pre><code># UIモジュールディレクトリを作成
mkdir -p ui data

# __init__.pyファイルを作成
touch ui/__init__.py

# requirements.txtを更新
cat >> requirements.txt << EOF
colorama>=0.4.6  # カラー出力
tabulate>=0.9.0  # テーブルフォーマット
EOF

# 新しい依存パッケージをインストール
pip install -r requirements.txt
</code></pre>
                    </div>
                </div>

                <!-- Display utilities implementation -->
                <div class="content-card">
                    <h3><span class="step-number">ステップ 2</span>表示ユーティリティの実装</h3>
                    <p>美しく見やすい表示を実現するための<strong>display.py</strong>を作成します。</p>

                    <h4>💻 完全なコード（ui/display.py）：</h4>
                    <div class="code-block">
                        <pre><code>"""
表示ユーティリティモジュール
カラー出力、テーブルフォーマット、プログレスバーなど
"""

from colorama import Fore, Back, Style, init
from tabulate import tabulate
from typing import List, Dict, Any
import sys

# colorama初期化（Windows対応）
init(autoreset=True)


class Colors:
    """カラー定義クラス"""
    # 基本色
    RED = Fore.RED
    GREEN = Fore.GREEN
    YELLOW = Fore.YELLOW
    BLUE = Fore.BLUE
    MAGENTA = Fore.MAGENTA
    CYAN = Fore.CYAN
    WHITE = Fore.WHITE
    
    # 背景色
    BG_RED = Back.RED
    BG_GREEN = Back.GREEN
    BG_YELLOW = Back.YELLOW
    
    # スタイル
    BRIGHT = Style.BRIGHT
    DIM = Style.DIM
    RESET = Style.RESET_ALL


class Display:
    """表示ユーティリティクラス"""
    
    @staticmethod
    def print_header(text: str, icon: str = ""):
        """ヘッダーを表示"""
        width = 60
        print("\n" + "=" * width)
        print(f"{icon} {text}".center(width))
        print("=" * width + "\n")
    
    @staticmethod
    def print_section(text: str):
        """セクションタイトルを表示"""
        print(f"\n{Colors.BRIGHT}{Colors.CYAN}▶ {text}{Colors.RESET}")
        print("-" * 50)
    
    @staticmethod
    def print_success(text: str):
        """成功メッセージを表示"""
        print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")
    
    @staticmethod
    def print_error(text: str):
        """エラーメッセージを表示"""
        print(f"{Colors.RED}❌ {text}{Colors.RESET}")
    
    @staticmethod
    def print_warning(text: str):
        """警告メッセージを表示"""
        print(f"{Colors.YELLOW}⚠️  {text}{Colors.RESET}")
    
    @staticmethod
    def print_info(text: str):
        """情報メッセージを表示"""
        print(f"{Colors.CYAN}ℹ️  {text}{Colors.RESET}")
    
    @staticmethod
    def print_table(headers: List[str], rows: List[List[Any]], 
                   tablefmt: str = "grid"):
        """
        テーブルを表示
        
        Args:
            headers: ヘッダー行
            rows: データ行のリスト
            tablefmt: テーブルフォーマット（grid, simple, fancy_grid等）
        """
        table_str = tabulate(rows, headers=headers, tablefmt=tablefmt)
        print(table_str)
    
    @staticmethod
    def print_status_bar(label: str, value: int, max_value: int = 100,
                        width: int = 20, show_percentage: bool = True):
        """
        ステータスバーを表示
        
        Args:
            label: ラベル
            value: 現在値
            max_value: 最大値
            width: バーの幅
            show_percentage: パーセンテージ表示の有無
        """
        percentage = (value / max_value) * 100 if max_value > 0 else 0
        filled = int((value / max_value) * width) if max_value > 0 else 0
        bar = "█" * filled + "░" * (width - filled)
        
        # 色の選択
        if percentage >= 70:
            color = Colors.GREEN
        elif percentage >= 30:
            color = Colors.YELLOW
        else:
            color = Colors.RED
        
        if show_percentage:
            print(f"{label}: {color}{bar}{Colors.RESET} {value}/{max_value} ({percentage:.1f}%)")
        else:
            print(f"{label}: {color}{bar}{Colors.RESET} {value}/{max_value}")
    
    @staticmethod
    def print_fish_status(fish):
        """魚の状態を表示"""
        print(f"\n{Colors.BRIGHT}🐠 {fish.name or fish.fish_id}{Colors.RESET}")
        print(f"  種類: {fish.species}")
        
        Display.print_status_bar("  健康度", fish.health)
        Display.print_status_bar("  空腹度", fish.hunger)
        Display.print_status_bar("  ストレス", fish.stress_level)
        
        # 状態表示
        status = []
        if fish.is_sick:
            status.append(f"{Colors.RED}病気{Colors.RESET}")
        if fish.hunger > 70:
            status.append(f"{Colors.YELLOW}空腹{Colors.RESET}")
        if fish.stress_level > 70:
            status.append(f"{Colors.YELLOW}ストレス{Colors.RESET}")
        if not status:
            status.append(f"{Colors.GREEN}元気{Colors.RESET}")
        
        print(f"  状態: {', '.join(status)}")
        print(f"  年齢: {fish.age}日  サイズ: {fish.size:.1f}cm")
    
    @staticmethod
    def print_tank_status(tank, tank_num: int):
        """水槽の状態を表示"""
        print(f"\n{Colors.BRIGHT}🏠 水槽 #{tank_num}{Colors.RESET}")
        print(f"  容量: {tank.capacity}L")
        print(f"  魚の数: {len(tank.fish_list)}匹")
        
        wq = tank.water_quality
        print(f"\n  💧 水質:")
        print(f"    温度: {wq['temperature']:.1f}°C")
        print(f"    pH: {wq['ph']:.1f}")
        
        Display.print_status_bar("    清潔度", int(wq['cleanliness']), width=15)
        
        if tank.equipment:
            print(f"\n  ⚙️ 装備: {len(tank.equipment)}個")
        if tank.decorations:
            print(f"  🎨 装飾: {len(tank.decorations)}個")
    
    @staticmethod
    def print_money(amount: float):
        """金額を表示"""
        color = Colors.GREEN if amount >= 0 else Colors.RED
        sign = "+" if amount > 0 else ""
        print(f"{color}{sign}¥{amount:,.0f}{Colors.RESET}")
    
    @staticmethod
    def clear_screen():
        """画面をクリア（クロスプラットフォーム）"""
        import os
        os.system('cls' if os.name == 'nt' else 'clear')
    
    @staticmethod
    def print_divider():
        """区切り線を表示"""
        print("-" * 60)
    
    @staticmethod
    def print_box(text: str, width: int = 60):
        """テキストをボックスで囲んで表示"""
        padding = (width - len(text) - 2) // 2
        print("┌" + "─" * (width - 2) + "┐")
        print("│" + " " * padding + text + " " * (width - 2 - padding - len(text)) + "│")
        print("└" + "─" * (width - 2) + "┘")
    
    @staticmethod
    def confirm(prompt: str) -> bool:
        """
        確認プロンプトを表示
        
        Args:
            prompt: 確認メッセージ
            
        Returns:
            bool: Yesならtrue
        """
        response = input(f"{Colors.YELLOW}{prompt} (y/n): {Colors.RESET}").lower()
        return response in ['y', 'yes']


# 使用例とテスト用関数
def test_display():
    """表示テスト"""
    Display.print_header("水族館ゲーム", "🐠")
    
    Display.print_section("ステータス")
    Display.print_success("魚を追加しました")
    Display.print_warning("水質が悪化しています")
    Display.print_error("魚が死んでしまいました")
    Display.print_info("新しいイベントが発生しました")
    
    Display.print_section("ステータスバー")
    Display.print_status_bar("健康度", 85)
    Display.print_status_bar("空腹度", 45)
    Display.print_status_bar("資金", 15000, 100000)
    
    Display.print_section("テーブル")
    headers = ["魚ID", "種類", "健康度", "状態"]
    rows = [
        ["fish_001", "goldfish", "95%", "元気"],
        ["fish_002", "clownfish", "60%", "空腹"],
        ["fish_003", "guppy", "25%", "病気"],
    ]
    Display.print_table(headers, rows)
    
    Display.print_section("金額表示")
    print("収入: ", end="")
    Display.print_money(5000)
    print("支出: ", end="")
    Display.print_money(-3000)
    
    Display.print_divider()
    Display.print_box("水族館へようこそ！")


if __name__ == "__main__":
    test_display()
</code></pre>
                    </div>

                    <div class="alert alert-success">
                        <strong>✅ このコードの特徴</strong><br>
                        • coloramaで美しいカラー出力<br>
                        • tabulateで整ったテーブル表示<br>
                        • ステータスバーで視覚的な情報提供<br>
                        • クロスプラットフォーム対応<br>
                    </div>

                    <h4>🧪 動作確認：</h4>
                    <div class="code-block">
                        <pre><code># display.pyをテスト実行
python ui/display.py

# 期待される出力:
# カラフルなヘッダー、セクション、メッセージ、
# テーブル、ステータスバーが表示されます
</code></pre>
                    </div>
                </div>
'''

def main():
    """Main function to generate complete phase files"""
    print("🚀 Building complete phase files...")
    print("📝 Generating Phase 3: UI Implementation...")
    
    # Generate Phase 3
    header = get_header("3", "UIの実装", "💻")
    content = generate_phase3_content()
    footer = get_footer()
    
    phase3_html = header + content + footer
    
    # Write to file
    output_path = "phase3_complete_new.html"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(phase3_html)
    
    print(f"✅ Generated {output_path} ({len(phase3_html)} characters)")
    print(f"📊 Current progress: Phase 3 initial structure complete")
    print(f"🔄 Note: This is the foundation. More content sections will be added...")

if __name__ == "__main__":
    main()
