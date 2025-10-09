# 🏗️ バーチャル水族館ゲーム - 詳細実装設計書

このドキュメントは、実際のコード実装に必要な詳細な設計情報、擬似コード、サンプルデータ構造、テスト計画を提供します。

## 📋 目次

1. [データ構造の詳細](#データ構造の詳細)
2. [主要メソッドの擬似コード](#主要メソッドの擬似コード)
3. [データファイル仕様](#データファイル仕様)
4. [テスト計画](#テスト計画)
5. [実装Tips](#実装tips)

---

## データ構造の詳細

### 1. Fishクラスのデータ構造

```python
@dataclass
class Fish:
    """魚の詳細データ構造"""
    
    # 基本情報
    fish_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    species: str = "goldfish"  # 種類
    name: str = ""  # 個体名（任意）
    
    # 状態パラメータ (0-100)
    health: int = 100        # 健康度
    hunger: int = 0          # 空腹度（高いほど空腹）
    stress_level: int = 0    # ストレスレベル
    
    # 成長パラメータ
    age: int = 0             # 年齢（日数）
    size: float = 5.0        # サイズ（cm）
    growth_rate: float = 0.01  # 成長速度
    
    # 経済パラメータ
    price: int = 100         # 購入価格
    
    # 飼育要件
    min_temperature: float = 20.0
    max_temperature: float = 28.0
    preferred_ph: float = 7.0
    
    # フラグ
    is_sick: bool = False
    can_breed: bool = False
    
    def __post_init__(self):
        """初期化後の処理"""
        if not self.name:
            self.name = f"{self.species}_{self.fish_id[:8]}"
```

### 2. Tankクラスのデータ構造

```python
class Tank:
    """水槽の詳細データ構造"""
    
    def __init__(self, tank_id: str, capacity: int):
        self.tank_id: str = tank_id
        self.capacity: int = capacity  # リットル
        
        # 水質パラメータ
        self.water_quality: Dict[str, float] = {
            'ph': 7.0,              # pH値 (0-14)
            'temperature': 25.0,     # 温度 (℃)
            'cleanliness': 100.0,    # 清潔度 (0-100)
            'oxygen': 100.0,         # 酸素濃度 (0-100)
            'ammonia': 0.0,          # アンモニア濃度 (0-100)
            'nitrite': 0.0,          # 亜硝酸濃度 (0-100)
        }
        
        # 収容物
        self.fish_list: List[Fish] = []
        self.equipment: List[Equipment] = []
        self.decorations: List[Decoration] = []
        
        # 統計
        self.days_since_cleaning: int = 0
        self.total_fish_deaths: int = 0
        
    def get_current_load(self) -> float:
        """現在の負荷を計算"""
        return sum(fish.size for fish in self.fish_list)
    
    def get_capacity_ratio(self) -> float:
        """容量使用率を返す (0.0-1.0)"""
        return self.get_current_load() / self.capacity if self.capacity > 0 else 0.0
```

### 3. Aquariumクラスのデータ構造

```python
class Aquarium:
    """水族館全体のデータ構造"""
    
    def __init__(self, name: str):
        self.name: str = name
        self.funds: float = 10000.0  # 初期資金
        self.tanks: List[Tank] = []
        
        # ゲーム進行
        self.current_day: int = 0
        self.start_date: datetime = datetime.now()
        
        # 統計
        self.reputation: int = 50  # 評判 (0-100)
        self.visitors_count: int = 0
        self.total_income: float = 0.0
        self.total_expenses: float = 0.0
        
        # イベントログ
        self.event_history: List[Dict] = []
        
        # 実績
        self.achievements: List[str] = []
```

---

## 主要メソッドの擬似コード

### 1. simulate_day() - 1日のシミュレーション

```python
def simulate_day(self) -> Dict:
    """
    1日のシミュレーションを実行
    
    Returns:
        Dict: 当日のイベント情報
    """
    events = []
    
    # ステップ1: 時間を進める
    self.aquarium.current_day += 1
    
    # ステップ2: 各水槽を処理
    for tank in self.aquarium.tanks:
        # 2.1 水質を劣化
        tank.update_water_quality(days=1)
        
        # 2.2 各魚を処理
        dead_fish = []
        for fish in tank.fish_list:
            # 魚の状態を更新
            fish.update_status(tank.water_quality)
            
            # 死亡判定
            if fish.health <= 0:
                dead_fish.append(fish)
                events.append({
                    'type': 'fish_died',
                    'fish_name': fish.name,
                    'tank_id': tank.tank_id,
                    'cause': determine_death_cause(fish, tank)
                })
        
        # 死んだ魚を削除
        for fish in dead_fish:
            tank.fish_list.remove(fish)
            tank.total_fish_deaths += 1
        
        # 2.3 装備の効果を適用
        for equipment in tank.equipment:
            equipment.apply_effect(tank)
            equipment.degrade(days=1)
            
            # 故障判定
            if equipment.condition <= 0:
                events.append({
                    'type': 'equipment_broken',
                    'equipment': equipment.name,
                    'tank_id': tank.tank_id
                })
    
    # ステップ3: 来客処理
    visitors = calculate_visitors()
    income = visitors * TICKET_PRICE
    self.aquarium.funds += income
    self.aquarium.visitors_count += visitors
    self.aquarium.total_income += income
    
    events.append({
        'type': 'daily_income',
        'visitors': visitors,
        'income': income
    })
    
    # ステップ4: 支出処理
    daily_expenses = calculate_daily_expenses()
    self.aquarium.funds -= daily_expenses
    self.aquarium.total_expenses += daily_expenses
    
    events.append({
        'type': 'daily_expenses',
        'amount': daily_expenses,
        'breakdown': get_expense_breakdown()
    })
    
    # ステップ5: ランダムイベント判定
    if random.random() < EVENT_PROBABILITY:
        random_event = generate_random_event()
        process_event(random_event)
        events.append(random_event)
    
    # ステップ6: 実績チェック
    new_achievements = check_achievements()
    if new_achievements:
        events.append({
            'type': 'achievements',
            'achievements': new_achievements
        })
    
    # ステップ7: 評判更新
    update_reputation()
    
    # イベントログに記録
    self.event_history.append({
        'day': self.aquarium.current_day,
        'events': events
    })
    
    return {
        'day': self.aquarium.current_day,
        'events': events,
        'funds': self.aquarium.funds,
        'reputation': self.aquarium.reputation
    }
```

### 2. feed_fish() - 餌やり処理

```python
def feed_fish(self, tank_id: str, fish_id: Optional[str] = None, amount: int = 20):
    """
    魚に餌を与える
    
    Args:
        tank_id: 水槽ID
        fish_id: 魚ID（Noneの場合は全魚に餌やり）
        amount: 餌の量（デフォルト20）
    
    Returns:
        bool: 成功/失敗
    """
    # ステップ1: 水槽を取得
    tank = get_tank_by_id(tank_id)
    if not tank:
        return False
    
    # ステップ2: 費用を確認
    cost = calculate_feed_cost(amount, len(tank.fish_list) if not fish_id else 1)
    if self.aquarium.funds < cost:
        return False
    
    # ステップ3: 餌やり実行
    fed_count = 0
    
    if fish_id:
        # 特定の魚に餌やり
        fish = find_fish_in_tank(tank, fish_id)
        if fish:
            fish.feed(amount)
            fed_count = 1
    else:
        # 全魚に餌やり
        for fish in tank.fish_list:
            fish.feed(amount)
            fed_count += 1
    
    # ステップ4: 費用を支払う
    self.aquarium.funds -= cost
    
    # ステップ5: 水質への影響
    # 餌やりは水を汚す
    tank.water_quality['cleanliness'] -= amount * 0.5
    tank.water_quality['ammonia'] += amount * 0.3
    
    return True
```

### 3. update_water_quality() - 水質更新

```python
def update_water_quality(self, days: int = 1):
    """
    水質パラメータを経時変化させる
    
    Args:
        days: 経過日数
    """
    # 基本劣化率
    CLEANLINESS_DECAY = 5.0
    OXYGEN_DECAY = 3.0
    AMMONIA_INCREASE = 2.0
    
    # 魚の数による影響
    fish_count = len(self.fish_list)
    fish_load = sum(f.size for f in self.fish_list)
    
    # 清潔度の低下
    cleanliness_decay = CLEANLINESS_DECAY * days
    cleanliness_decay += fish_load * 0.1 * days
    self.water_quality['cleanliness'] = max(0, self.water_quality['cleanliness'] - cleanliness_decay)
    
    # 酸素濃度の低下
    oxygen_consumption = fish_count * OXYGEN_DECAY * days
    self.water_quality['oxygen'] = max(20, self.water_quality['oxygen'] - oxygen_consumption)
    
    # 有害物質の増加
    self.water_quality['ammonia'] = min(100, self.water_quality['ammonia'] + AMMONIA_INCREASE * days)
    
    # pH値の変動（アンモニアが増えるとアルカリ性に）
    ph_shift = self.water_quality['ammonia'] * 0.001
    self.water_quality['ph'] = min(9.0, self.water_quality['ph'] + ph_shift)
    
    # 温度の自然変動（季節による）
    seasonal_temp = calculate_seasonal_temperature(self.aquarium.current_day)
    temp_diff = seasonal_temp - self.water_quality['temperature']
    self.water_quality['temperature'] += temp_diff * 0.1  # ゆっくり変化
    
    # 装備による補正は別途 equipment.apply_effect() で処理
    
    # 日数カウント
    self.days_since_cleaning += days
```

### 4. calculate_beauty_score() - 美観スコア計算

```python
def calculate_beauty_score(self) -> int:
    """
    水槽の美観スコアを計算
    
    Returns:
        int: 美観スコア (0-100)
    """
    score = 0
    
    # ベーススコア: 清潔度
    score += self.water_quality['cleanliness'] * 0.3
    
    # 装飾による加点
    decoration_score = sum(d.beauty_value for d in self.decorations)
    # 装飾が多すぎると逆効果
    if len(self.decorations) > 10:
        decoration_score *= 0.8
    score += min(50, decoration_score)
    
    # 魚の数と種類による加点
    fish_species = set(f.species for f in self.fish_list)
    species_bonus = len(fish_species) * 5  # 多様性ボーナス
    score += min(20, species_bonus)
    
    # 魚の健康度による加点
    if self.fish_list:
        avg_health = sum(f.health for f in self.fish_list) / len(self.fish_list)
        health_bonus = avg_health * 0.15
        score += health_bonus
    
    # バランスチェック: 過密はマイナス
    capacity_ratio = self.get_capacity_ratio()
    if capacity_ratio > 0.8:
        score *= 0.7  # 過密ペナルティ
    
    return int(min(100, max(0, score)))
```

---

## データファイル仕様

### fish_species.json

```json
{
  "species": [
    {
      "id": "goldfish",
      "name": "金魚",
      "description": "日本の伝統的な観賞魚",
      "base_price": 100,
      "rarity": "common",
      "base_size": 5.0,
      "max_size": 20.0,
      "growth_rate": 0.01,
      "lifespan_days": 365,
      "requirements": {
        "min_temp": 15.0,
        "max_temp": 28.0,
        "preferred_ph": 7.0,
        "min_tank_size": 20
      },
      "behavior": {
        "aggression": 1,
        "schooling": true,
        "activity_level": "medium"
      },
      "compatibility": ["goldfish", "koi"]
    },
    {
      "id": "clownfish",
      "name": "クマノミ",
      "description": "カラフルな海水魚",
      "base_price": 500,
      "rarity": "uncommon",
      "base_size": 3.0,
      "max_size": 11.0,
      "growth_rate": 0.005,
      "lifespan_days": 180,
      "requirements": {
        "min_temp": 24.0,
        "max_temp": 28.0,
        "preferred_ph": 8.2,
        "min_tank_size": 30
      },
      "behavior": {
        "aggression": 3,
        "schooling": false,
        "activity_level": "high"
      },
      "compatibility": ["clownfish", "anemonefish"]
    },
    {
      "id": "betta",
      "name": "ベタ",
      "description": "美しいひれを持つ闘魚",
      "base_price": 300,
      "rarity": "common",
      "base_size": 4.0,
      "max_size": 7.0,
      "growth_rate": 0.008,
      "lifespan_days": 120,
      "requirements": {
        "min_temp": 24.0,
        "max_temp": 30.0,
        "preferred_ph": 7.0,
        "min_tank_size": 10
      },
      "behavior": {
        "aggression": 8,
        "schooling": false,
        "activity_level": "medium"
      },
      "compatibility": ["betta"]
    }
  ]
}
```

### equipment.json

```json
{
  "equipment": [
    {
      "id": "filter_basic",
      "name": "基本フィルター",
      "type": "filter",
      "price": 1000,
      "maintenance_cost": 50,
      "durability": 365,
      "efficiency": 0.6,
      "effects": {
        "cleanliness": 10,
        "ammonia": -5,
        "oxygen": 5
      }
    },
    {
      "id": "filter_advanced",
      "name": "高性能フィルター",
      "type": "filter",
      "price": 3000,
      "maintenance_cost": 100,
      "durability": 730,
      "efficiency": 0.9,
      "effects": {
        "cleanliness": 20,
        "ammonia": -10,
        "oxygen": 10
      }
    },
    {
      "id": "heater",
      "name": "ヒーター",
      "type": "heater",
      "price": 800,
      "maintenance_cost": 30,
      "durability": 365,
      "efficiency": 0.8,
      "effects": {
        "temperature": 2.0
      },
      "target_temperature": 25.0
    },
    {
      "id": "aerator",
      "name": "エアレーター",
      "type": "aerator",
      "price": 500,
      "maintenance_cost": 20,
      "durability": 730,
      "efficiency": 0.7,
      "effects": {
        "oxygen": 15
      }
    }
  ]
}
```

### decorations.json

```json
{
  "decorations": [
    {
      "id": "rock_small",
      "name": "小石",
      "category": "rock",
      "price": 50,
      "size": 2,
      "beauty_value": 5,
      "rarity": "common",
      "provides_shelter": true
    },
    {
      "id": "plant_basic",
      "name": "水草",
      "category": "plant",
      "price": 100,
      "size": 3,
      "beauty_value": 8,
      "rarity": "common",
      "provides_shelter": true,
      "oxygen_boost": 2
    },
    {
      "id": "castle",
      "name": "城",
      "category": "structure",
      "price": 500,
      "size": 10,
      "beauty_value": 20,
      "rarity": "uncommon",
      "provides_shelter": true
    },
    {
      "id": "coral_reef",
      "name": "サンゴ礁",
      "category": "coral",
      "price": 800,
      "size": 8,
      "beauty_value": 25,
      "rarity": "rare",
      "provides_shelter": true
    },
    {
      "id": "treasure_chest",
      "name": "宝箱",
      "category": "novelty",
      "price": 300,
      "size": 5,
      "beauty_value": 15,
      "rarity": "uncommon",
      "provides_shelter": false
    }
  ]
}
```

---

## テスト計画

### 1. models.py のユニットテスト

```python
# test_models.py

import pytest
from models import Fish, Tank, Aquarium

class TestFish:
    """Fishクラスのテスト"""
    
    def test_fish_initialization(self):
        """魚の初期化テスト"""
        fish = Fish(species="goldfish", name="テスト金魚")
        assert fish.health == 100
        assert fish.hunger == 0
        assert fish.species == "goldfish"
    
    def test_feed_reduces_hunger(self):
        """餌やりで空腹度が減るテスト"""
        fish = Fish(species="goldfish")
        fish.hunger = 50
        fish.feed(20)
        assert fish.hunger == 30
    
    def test_feed_increases_health(self):
        """餌やりで健康度が増すテスト"""
        fish = Fish(species="goldfish")
        fish.health = 80
        fish.feed(20)
        assert fish.health == 85  # 20 // 4 = 5
    
    def test_hunger_cannot_be_negative(self):
        """空腹度が負にならないテスト"""
        fish = Fish(species="goldfish")
        fish.hunger = 10
        fish.feed(50)
        assert fish.hunger == 0
    
    def test_health_cap_at_100(self):
        """健康度が100を超えないテスト"""
        fish = Fish(species="goldfish")
        fish.health = 98
        fish.feed(100)
        assert fish.health == 100
    
    def test_update_status_increases_hunger(self):
        """状態更新で空腹度が増すテスト"""
        fish = Fish(species="goldfish")
        environment = {'cleanliness': 80}
        fish.update_status(environment)
        assert fish.hunger > 0
    
    def test_poor_water_quality_decreases_health(self):
        """水質悪化で健康度が下がるテスト"""
        fish = Fish(species="goldfish")
        initial_health = fish.health
        environment = {'cleanliness': 20}
        fish.update_status(environment)
        assert fish.health < initial_health
    
    def test_fish_growth(self):
        """魚の成長テスト"""
        fish = Fish(species="goldfish")
        initial_size = fish.size
        fish.age = 30
        fish.grow()
        assert fish.size > initial_size

class TestTank:
    """Tankクラスのテスト"""
    
    def test_tank_initialization(self):
        """水槽の初期化テスト"""
        tank = Tank(tank_id="test_tank", capacity=100)
        assert tank.capacity == 100
        assert tank.water_quality['ph'] == 7.0
        assert len(tank.fish_list) == 0
    
    def test_add_fish_success(self):
        """魚の追加成功テスト"""
        tank = Tank(tank_id="test_tank", capacity=100)
        fish = Fish(species="goldfish")
        fish.size = 10
        result = tank.add_fish(fish)
        assert result == True
        assert len(tank.fish_list) == 1
    
    def test_add_fish_capacity_exceeded(self):
        """容量超過で魚を追加できないテスト"""
        tank = Tank(tank_id="test_tank", capacity=10)
        fish = Fish(species="goldfish")
        fish.size = 15
        result = tank.add_fish(fish)
        assert result == False
        assert len(tank.fish_list) == 0
    
    def test_update_water_quality_degrades(self):
        """水質が劣化するテスト"""
        tank = Tank(tank_id="test_tank", capacity=100)
        initial_cleanliness = tank.water_quality['cleanliness']
        tank.update_water_quality(days=1)
        assert tank.water_quality['cleanliness'] < initial_cleanliness
    
    def test_clean_tank_restores_quality(self):
        """水槽清掃で水質が回復するテスト"""
        tank = Tank(tank_id="test_tank", capacity=100)
        tank.water_quality['cleanliness'] = 50
        tank.clean_tank()
        assert tank.water_quality['cleanliness'] == 100

class TestAquarium:
    """Aquariumクラスのテスト"""
    
    def test_aquarium_initialization(self):
        """水族館の初期化テスト"""
        aquarium = Aquarium(name="テスト水族館")
        assert aquarium.name == "テスト水族館"
        assert aquarium.funds == 10000.0
        assert aquarium.current_day == 0
    
    def test_add_tank(self):
        """水槽追加テスト"""
        aquarium = Aquarium(name="テスト水族館")
        tank = aquarium.add_tank(capacity=50)
        assert len(aquarium.tanks) == 1
        assert tank.capacity == 50
```

### 2. logic.py のユニットテスト

```python
# test_logic.py

import pytest
from logic import GameEngine
from models import Aquarium, Tank, Fish

class TestGameEngine:
    """GameEngineクラスのテスト"""
    
    def test_simulate_day_increments_day(self):
        """日送りでdayが増加するテスト"""
        aquarium = Aquarium(name="テスト")
        engine = GameEngine(aquarium)
        result = engine.simulate_day()
        assert aquarium.current_day == 1
    
    def test_simulate_day_generates_income(self):
        """日送りで収入が発生するテスト"""
        aquarium = Aquarium(name="テスト")
        initial_funds = aquarium.funds
        engine = GameEngine(aquarium)
        result = engine.simulate_day()
        # 収入 - 支出の結果資金が変動
        assert aquarium.funds != initial_funds
    
    def test_feed_all_fish_success(self):
        """全魚への餌やり成功テスト"""
        aquarium = Aquarium(name="テスト")
        tank = Tank("tank1", 100)
        tank.fish_list.append(Fish(species="goldfish"))
        tank.fish_list.append(Fish(species="goldfish"))
        aquarium.tanks.append(tank)
        
        engine = GameEngine(aquarium)
        result = engine.feed_all_fish("tank1")
        assert result == True
    
    def test_calculate_visitors_based_on_reputation(self):
        """評判が来客数に影響するテスト"""
        aquarium1 = Aquarium(name="高評判")
        aquarium1.reputation = 80
        engine1 = GameEngine(aquarium1)
        visitors1 = engine1.calculate_visitors()
        
        aquarium2 = Aquarium(name="低評判")
        aquarium2.reputation = 20
        engine2 = GameEngine(aquarium2)
        visitors2 = engine2.calculate_visitors()
        
        assert visitors1 > visitors2
```

### 3. ui.py の統合テスト

```python
# test_ui.py

import pytest
from io import StringIO
from ui import AquariumCUI
from models import Aquarium

class TestAquariumCUI:
    """AquariumCUIクラスのテスト"""
    
    def test_status_command_displays_info(self, capsys):
        """statusコマンドが情報を表示するテスト"""
        aquarium = Aquarium(name="テスト水族館")
        cui = AquariumCUI(aquarium)
        cui.onecmd("status")
        
        captured = capsys.readouterr()
        assert "テスト水族館" in captured.out
        assert "資金" in captured.out
    
    def test_feed_command_with_valid_tank(self):
        """有効な水槽への餌やりコマンドテスト"""
        aquarium = Aquarium(name="テスト")
        tank = Tank("tank1", 100)
        aquarium.tanks.append(tank)
        
        cui = AquariumCUI(aquarium)
        cui.onecmd("feed tank1")
        # エラーが発生しないことを確認
    
    def test_invalid_command_shows_error(self, capsys):
        """無効なコマンドでエラー表示テスト"""
        aquarium = Aquarium(name="テスト")
        cui = AquariumCUI(aquarium)
        cui.onecmd("invalid_command")
        
        captured = capsys.readouterr()
        # cmd.Cmdがデフォルトでエラーを出力
        assert len(captured.out) > 0 or len(captured.err) > 0
```

---

## 実装Tips

### 1. エラーハンドリング

```python
def buy_fish(self, species: str, tank_id: str) -> bool:
    """魚を購入"""
    try:
        # 魚種データを読み込み
        fish_data = load_fish_species(species)
        if not fish_data:
            print(f"❌ エラー: 魚種'{species}'が見つかりません")
            return False
        
        # 資金チェック
        if self.aquarium.funds < fish_data['base_price']:
            print(f"❌ エラー: 資金不足（必要: ¥{fish_data['base_price']}）")
            return False
        
        # 水槽取得
        tank = self.get_tank_by_id(tank_id)
        if not tank:
            print(f"❌ エラー: 水槽'{tank_id}'が見つかりません")
            return False
        
        # 魚を作成して追加
        fish = create_fish_from_data(fish_data)
        if not tank.add_fish(fish):
            print(f"❌ エラー: 水槽の容量不足")
            return False
        
        # 支払い
        self.aquarium.funds -= fish_data['base_price']
        print(f"✅ {fish.name}を購入しました（-¥{fish_data['base_price']}）")
        return True
        
    except FileNotFoundError:
        print("❌ エラー: 魚種データファイルが見つかりません")
        return False
    except Exception as e:
        print(f"❌ 予期しないエラー: {e}")
        return False
```

### 2. セーブ/ロード機能

```python
import json
from datetime import datetime

def save_game(aquarium: Aquarium, filename: str):
    """ゲームを保存"""
    save_data = {
        'version': '1.0',
        'saved_at': datetime.now().isoformat(),
        'aquarium': {
            'name': aquarium.name,
            'funds': aquarium.funds,
            'current_day': aquarium.current_day,
            'reputation': aquarium.reputation,
            'visitors_count': aquarium.visitors_count,
        },
        'tanks': [
            {
                'tank_id': tank.tank_id,
                'capacity': tank.capacity,
                'water_quality': tank.water_quality,
                'fish_list': [
                    {
                        'fish_id': fish.fish_id,
                        'species': fish.species,
                        'name': fish.name,
                        'health': fish.health,
                        'hunger': fish.hunger,
                        'age': fish.age,
                        'size': fish.size,
                    }
                    for fish in tank.fish_list
                ],
                'decorations': [d.__dict__ for d in tank.decorations],
            }
            for tank in aquarium.tanks
        ]
    }
    
    save_path = f"saves/{filename}.json"
    with open(save_path, 'w', encoding='utf-8') as f:
        json.dump(save_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ ゲームを保存しました: {save_path}")

def load_game(filename: str) -> Aquarium:
    """ゲームを読み込み"""
    save_path = f"saves/{filename}.json"
    
    with open(save_path, 'r', encoding='utf-8') as f:
        save_data = json.load(f)
    
    # Aquariumを再構築
    aquarium = Aquarium(name=save_data['aquarium']['name'])
    aquarium.funds = save_data['aquarium']['funds']
    aquarium.current_day = save_data['aquarium']['current_day']
    aquarium.reputation = save_data['aquarium']['reputation']
    aquarium.visitors_count = save_data['aquarium']['visitors_count']
    
    # Tanksを再構築
    for tank_data in save_data['tanks']:
        tank = Tank(tank_data['tank_id'], tank_data['capacity'])
        tank.water_quality = tank_data['water_quality']
        
        # Fishを再構築
        for fish_data in tank_data['fish_list']:
            fish = Fish(**fish_data)
            tank.fish_list.append(fish)
        
        aquarium.tanks.append(tank)
    
    print(f"✅ ゲームを読み込みました: {save_path}")
    return aquarium
```

### 3. カラフルな出力

```python
# colorama を使用（オプション）
from colorama import Fore, Back, Style, init

init(autoreset=True)

def print_tank_status(tank: Tank):
    """水槽状態をカラフルに表示"""
    print(f"\n{'='*60}")
    print(f"{Fore.CYAN}🏺 水槽: {tank.tank_id}{Style.RESET_ALL}")
    print(f"{'='*60}")
    
    # 水質表示
    cleanliness = tank.water_quality['cleanliness']
    if cleanliness > 70:
        color = Fore.GREEN
    elif cleanliness > 40:
        color = Fore.YELLOW
    else:
        color = Fore.RED
    
    print(f"{color}清潔度: {cleanliness:.1f}{Style.RESET_ALL}")
    print(f"pH: {tank.water_quality['ph']:.1f}")
    print(f"温度: {tank.water_quality['temperature']:.1f}℃")
    print(f"酸素: {tank.water_quality['oxygen']:.1f}")
    
    # 魚リスト
    print(f"\n{Fore.YELLOW}🐠 飼育中の魚 ({len(tank.fish_list)}匹):{Style.RESET_ALL}")
    for fish in tank.fish_list:
        health_icon = "💚" if fish.health > 70 else "💛" if fish.health > 40 else "💔"
        print(f"  {health_icon} {fish.name} ({fish.species}) - 健康度: {fish.health}")
```

### 4. バランス調整の定数

```python
# config.py

# 経済関連
INITIAL_FUNDS = 10000
TICKET_PRICE = 10
DAILY_MAINTENANCE_COST = 50

# 水質関連
CLEANLINESS_DECAY_RATE = 5.0
OXYGEN_DECAY_RATE = 3.0
AMMONIA_INCREASE_RATE = 2.0

# 餌関連
FEED_COST_PER_UNIT = 5
DEFAULT_FEED_AMOUNT = 20
HUNGER_INCREASE_RATE = 5

# 健康関連
HEALTH_DECAY_HUNGRY = 10
HEALTH_DECAY_POOR_WATER = 5
HEALTH_RECOVERY_FED = 5

# イベント
EVENT_PROBABILITY = 0.1  # 10%
BREEDING_PROBABILITY = 0.05  # 5%

# 実績
ACHIEVEMENTS = {
    'first_fish': '初めての魚を購入',
    'ten_fish': '10匹の魚を飼育',
    'hundred_visitors': '累計来客100人達成',
    'master_aquarist': '評判100達成',
    'rich': '資金100,000達成',
    'survivor': '100日生存',
}
```

---

## まとめ

このドキュメントは、バーチャル水族館ゲームの実装に必要な詳細情報を提供しています。

### 実装の順序（推奨）

1. **models.py** - データクラスから開始
2. **config.py** - 定数を定義
3. **utils.py** - ヘルパー関数を実装
4. **logic.py** - ゲームロジックを実装
5. **ui.py** - UIを実装
6. **main.py** - エントリーポイントを作成
7. **データファイル** - JSON形式で魚種、装備、装飾データを作成
8. **テスト** - 各モジュールのテストを作成

### 次のステップ

1. このドキュメントを基にプロジェクト構造を作成
2. 各モジュールを順次実装
3. テストを書きながら開発
4. バランス調整とデバッグ
5. 追加機能の実装

開発中に質問や不明点があれば、このドキュメントとindex.htmlを参照してください！

---

**作成日**: 2025年1月
**バージョン**: 1.0
**対象読者**: バーチャル水族館ゲーム開発者
