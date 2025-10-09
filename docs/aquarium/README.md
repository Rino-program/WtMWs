```markdown
# 仮想水族館ゲーム ドキュメント
このディレクトリは、仮想水族館ゲーム（CUIベース想定）の詳細設計ドキュメントと、視覚化資料（図解）をまとめたものです。ゲーム設計案（要件）をもとに、クラス設計、モジュール構成、UI（CUI）設計、状態遷移、アクション、データモデル、例・シナリオ、拡張案などを詳述しています。

---

目次
1. 概要
2. ゲーム目的と評価軸（要約）
3. クラス設計詳細（属性・メソッド・相互作用）
4. モジュール構成と依存関係
5. CUI（ユーザーインターフェース）設計詳細
6. ゲームループとシミュレーション（擬似コード）
7. データ保存・シリアライズ案
8. テスト設計案
9. 拡張案（マルチプレイヤー、GUI移植、従業員システムなど）
10. 図（クラス図 / フロー / シーケンス）
11. ファイル一覧と導入手順
12. プルリクエスト（PR）内容案

---

1. 概要
このドキュメントは、提供されたゲーム設計案を元に、実装しやすく・保守しやすく・拡張しやすい形でまとめた技術設計書です。目的は、あなた（開発者）が実装を始められるように完全に具体化することと、他の開発者に説明できる図や文章を用意することです。

2. ゲーム目的と評価軸（要約）
- 目的: 世界一の仮想水族館を作る（ランキング）
- 評価基準:
  - 来場者満足度（珍しい魚、健康な魚、展示の多様性）
  - 収益（チケット、グッズ、イベント）
  - 水槽の環境評価（水質・設備の質・装飾）
  - 魚の種類と数（多様性・希少性）

3. クラス設計詳細
以下に、各クラスの設計を項目ごとに詳述します。型は Python や JavaScript のオブジェクトで表現可能です。

3.1 Aquarium
- 概要: 水族館全体を管理するルートオブジェクト
- 属性:
  - tanks: Map<string, Tank> または Tank[] - 所有する水槽
  - inventory: Record<string, {item: Item, qty: number}>
  - funds: number - 現在の資金
  - reputation: number - 評判（0-100）
  - elapsed_time: integer（日数など）
  - visitor_count: integer（当日）
  - employees: Employee[]（将来拡張）
- メソッド:
  - add_tank(tank: Tank)
  - remove_tank(tankId: string)
  - buy_item(item: Item, quantity: number)
  - sell_item(itemName: string, quantity: number)
  - hire_employee(employee: Employee)
  - fire_employee(employeeId: string)
  - simulate_day(): void
  - calculate_revenue(): number
  - calculate_expenses(): number
  - update_reputation(delta?: number): void
  - update_visitor_count(): number
  - serialize()/deserialize()（セーブ/ロード用）

実装上のポイント:
- simulate_day() は「来場者数算出 -> 収益算出 -> 魚・水槽の状態変化 -> イベント発生判定 -> 結果集約」を順に行う。
- トランザクション的に失敗があればロールバックしやすいよう、処理は小さなステップに分ける。

3.2 Tank
- 属性:
  - id: string
  - name: string
  - size: number（リットルなど）
  - fish: Fish[]（インスタンス配列）
  - equipment: Equipment[]
  - decorations: Decoration[]
  - water_quality: { cleanliness: number, temperature: number, salinity?: number }
  - cleanliness: number（0-100）
- メソッド:
  - add_fish(f: Fish)
  - remove_fish(fishId: string)
  - add_equipment(e: Equipment)
  - remove_equipment(equipmentId: string)
  - add_decoration(d: Decoration)
  - remove_decoration(decorationId: string)
  - feed_fish(food_type: string)
  - clean()
  - update_water_quality()
  - get_compatible_fish(FishSpecies): boolean

実装上のポイント:
- 水質計算は設備の合計効果 + 汚れペナルティ + 魚のバイオロードで決定する。
- 魚の最大数は size と魚種のサイズ係数から決める。

3.3 Fish
- 属性:
  - id: string
  - species: string
  - name?: string
  - health: number（0-100）
  - fullness: number（0-100）
  - age: number（成長段階）
  - price: number（売却時価格）
  - food_preference: string[]
  - tank_requirements: { temperature_range: [min,max], salinity_range?: [min,max], min_size?: number }
  - rarity: number（評価用、1-5）
- メソッド:
  - eat(food_type: string)
  - get_hungry()
  - get_sick(cause?: string)
  - heal(amount?: number)
  - grow()
  - is_compatible(other: Fish): boolean
  - toDisplay(): string

実装上のポイント:
- 食事と満腹度は日次処理で減少。満腹度が低いと健康が落ちる。
- 水質閾値を外れると病気確率上昇。

3.4 Equipment
- 属性:
  - id: string
  - type: 'Filter'|'Heater'|'Light'|string
  - level: number
  - maintenance_required: boolean
  - maintenance_timer: number
  - cost: number
  - effect: { cleanliness_delta_per_day?: number, temp_stability?: number, aesthetics?: number }
- メソッド:
  - apply_effect(tank: Tank)
  - require_maintenance()
  - perform_maintenance()

実装上のポイント:
- 稼働中の設備は日次で水質・温度安定性に影響。
- 維持費（電力費）や故障確率を掛けると良い。

3.5 Decoration
- 属性:
  - id: string
  - type: string
  - aesthetics: number
  - fish_comfort_effect: number
  - cost: number
- メソッド:
  - apply_effect(tank: Tank)

3.6 Item
- 属性:
  - id: string
  - type: 'Fish Food'|'Medicine'|'Cleaning Kit'|string
  - effect: { fullness_delta?: number, heal_amount?: number, cleanliness_delta?: number }
  - cost: number
- メソッド:
  - use(target: Fish|Tank)

4. モジュール構成と依存関係
提案: models.py (または models/*.js), logic.py (または logic/*.js), ui.py (CUI用) の 3階層構成。

- models: データ構造と単純メソッド（状態変更ロジックは小さく抑える）
- logic: ビジネスロジック（simulate_day、収益・費用計算、イベント発生）
- ui: 入力解析、表示フォーマット、ユーザーフィードバック

依存関係:
ui -> logic -> models（上位が下位を呼ぶ）

5. CUI設計（詳細）
5.1 コマンド一覧（例）
- help: コマンド一覧を表示
- status: 水族館の要約を表示
- view_tank <id>: 指定水槽の詳細
- buy_fish <species> <tank_id> [qty]: 魚を購入
- sell_fish <fish_id>: 魚を売却
- feed <tank_id> <food_type> [qty]
- clean <tank_id>
- upgrade_equipment <tank_id> <equipment_type>
- add_tank <name> <size>
- simulate <days>（早送り）
- save <filename>, load <filename>

5.2 入力解析
- InputHandler クラスを用意。raw input -> tokenization -> command dispatch。
- コマンド間違いは help と候補表示（例: Levenshtein距離で候補提示）。

5.3 表示例（フォーマット）
- ヘッダ: 水族館名 | 資金 | 評判 | 経過日
- 各水槽はテーブル状に: TankID | Name | Size | FishCount | Cleanliness | WaterTemp
- 個別魚表示は一覧で species, health, fullness, age, rarity を表示

6. ゲームループ（擬似コード）
```
loop:
  input = get_user_input()
  if input == 'exit' break
  result = UI.parse_and_call_logic(input)
  if result.modifies_time:
    for day in 1..result.days:
      aquarium.simulate_day()
  UI.render_status(aquarium)
```

simulate_day 内の流れ:
- visitor_count = update_visitor_count()
- revenue = calculate_revenue(visitor_count)
- expenses = calculate_expenses()
- for each tank:
    tank.update_water_quality()
    for fish in tank.fish:
       fish.get_hungry()
       if fish.fullness < threshold: fish.get_sick()
       fish.grow()
- update_reputation()
- apply_random_events()

7. データ保存・シリアライズ
- JSON で保存（versionフィールドを付けて互換性確保）
- 主要オブジェクトは toJSON()/fromJSON() を実装
- セーブスロット管理（autosave 毎N日）

8. テスト設計案
- Unit:
  - Fish.eat / get_hungry / get_sick の境界値
  - Tank.update_water_quality の設備効果の単体テスト
  - Aquarium.calculate_revenue の定常系
- Integration:
  - simulate_day が一貫した状態遷移を起こすか
- E2E:
  - コマンド連続入力で期待した状態になるか

9. 拡張案（短く）
- GUI（Web, Electron, Unity）
- マルチプレイヤー（ランキング / 交流）
- 従業員管理、広告・スポンサーシステム
- 季節イベント、リアルタイムイベント

10. 図
- docs/aquarium/diagrams.svg を参照してください（このディレクトリに含まれています）。

---

ファイル一覧:
- docs/aquarium/README.md (このファイル)
- docs/aquarium/index.html （Web表示用、対話的なドキュメント）
- docs/aquarium/styles.css
- docs/aquarium/script.js
- docs/aquarium/diagrams.svg
- docs/aquarium/PULL_REQUEST.md（PR本文案）

導入手順（ローカルでの手順、Git 操作例）:
1. ブランチが無い場合:
   git checkout -b feature/aquarium-docs
2. ファイルを追加:
   git add docs/aquarium/*
3. コミット:
   git commit -m "Add aquarium design docs and diagrams"
4. プッシュ:
   git push --set-upstream origin feature/aquarium-docs
5. GitHub 上で PR を作成（PRタイトル・本文案は PULL_REQUEST.md に記載）

PR 作成を私に任せたい場合は「PRを作って」と言ってください。私はブランチの作成は完了しており、ファイルを push して PR を作成します。