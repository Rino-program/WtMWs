#!/usr/bin/env python3
"""
Generate comprehensive implementations for Phase 4, 5, and Bugfix
Based on planning documents and maintaining consistency with Phase 3
"""

import json
import os

def generate_phase4_fish_data():
    """Generate comprehensive fish_species.json with 15 species"""
    return {
        "version": "1.0",
        "species": [
            {
                "id": "goldfish",
                "name": "金魚",
                "name_en": "Goldfish",
                "description": "日本の伝統的な観賞魚。初心者に最適で丈夫で飼いやすい。色鮮やかで見た目も美しい。",
                "category": "freshwater",
                "rarity": "common",
                "base_price": 100,
                "sell_price": 50,
                "base_size": 5.0,
                "max_size": 20.0,
                "growth_rate": 0.01,
                "lifespan_days": 365,
                "requirements": {
                    "min_temp": 15.0,
                    "max_temp": 28.0,
                    "preferred_ph": 7.0,
                    "ph_tolerance": 1.0,
                    "min_tank_size": 20,
                    "compatibility": ["goldfish", "koi", "loach", "guppy"]
                },
                "stats": {
                    "base_health": 100,
                    "hunger_rate": 5,
                    "stress_sensitivity": 0.5,
                    "disease_resistance": 0.7
                },
                "appeal": {
                    "beauty": 7,
                    "rarity_bonus": 1,
                    "visitor_attraction": 5
                }
            },
            {
                "id": "koi",
                "name": "鯉",
                "name_en": "Koi",
                "description": "日本の高級観賞魚。大きく育ち、美しい模様が特徴。長寿で人によく懐く。",
                "category": "freshwater",
                "rarity": "uncommon",
                "base_price": 500,
                "sell_price": 300,
                "base_size": 10.0,
                "max_size": 60.0,
                "growth_rate": 0.02,
                "lifespan_days": 1825,
                "requirements": {
                    "min_temp": 10.0,
                    "max_temp": 25.0,
                    "preferred_ph": 7.2,
                    "ph_tolerance": 0.8,
                    "min_tank_size": 100,
                    "compatibility": ["koi", "goldfish", "loach"]
                },
                "stats": {
                    "base_health": 150,
                    "hunger_rate": 8,
                    "stress_sensitivity": 0.4,
                    "disease_resistance": 0.8
                },
                "appeal": {
                    "beauty": 9,
                    "rarity_bonus": 3,
                    "visitor_attraction": 12
                }
            },
            {
                "id": "clownfish",
                "name": "クマノミ",
                "name_en": "Clownfish",
                "description": "カラフルな海水魚。映画で有名になった人気の魚。イソギンチャクと共生する。",
                "category": "saltwater",
                "rarity": "uncommon",
                "base_price": 300,
                "sell_price": 180,
                "base_size": 3.0,
                "max_size": 11.0,
                "growth_rate": 0.008,
                "lifespan_days": 730,
                "requirements": {
                    "min_temp": 24.0,
                    "max_temp": 28.0,
                    "preferred_ph": 8.1,
                    "ph_tolerance": 0.3,
                    "min_tank_size": 30,
                    "compatibility": ["clownfish", "tang", "damselfish"]
                },
                "stats": {
                    "base_health": 80,
                    "hunger_rate": 6,
                    "stress_sensitivity": 0.6,
                    "disease_resistance": 0.6
                },
                "appeal": {
                    "beauty": 8,
                    "rarity_bonus": 3,
                    "visitor_attraction": 10
                }
            },
            {
                "id": "angelfish",
                "name": "エンゼルフィッシュ",
                "name_en": "Angelfish",
                "description": "優雅な形の淡水魚。ゆったりとした動きが美しく、水草水槽に最適。",
                "category": "freshwater",
                "rarity": "uncommon",
                "base_price": 250,
                "sell_price": 150,
                "base_size": 4.0,
                "max_size": 15.0,
                "growth_rate": 0.012,
                "lifespan_days": 1095,
                "requirements": {
                    "min_temp": 24.0,
                    "max_temp": 30.0,
                    "preferred_ph": 6.5,
                    "ph_tolerance": 1.0,
                    "min_tank_size": 40,
                    "compatibility": ["angelfish", "tetra", "guppy"]
                },
                "stats": {
                    "base_health": 90,
                    "hunger_rate": 5,
                    "stress_sensitivity": 0.7,
                    "disease_resistance": 0.65
                },
                "appeal": {
                    "beauty": 8,
                    "rarity_bonus": 2,
                    "visitor_attraction": 8
                }
            },
            {
                "id": "guppy",
                "name": "グッピー",
                "name_en": "Guppy",
                "description": "小型で繁殖力が強い熱帯魚。カラフルな尾ビレが美しく、初心者向け。",
                "category": "freshwater",
                "rarity": "common",
                "base_price": 50,
                "sell_price": 25,
                "base_size": 2.0,
                "max_size": 6.0,
                "growth_rate": 0.005,
                "lifespan_days": 180,
                "requirements": {
                    "min_temp": 22.0,
                    "max_temp": 28.0,
                    "preferred_ph": 7.0,
                    "ph_tolerance": 1.5,
                    "min_tank_size": 10,
                    "compatibility": ["guppy", "tetra", "platy", "molly"]
                },
                "stats": {
                    "base_health": 70,
                    "hunger_rate": 4,
                    "stress_sensitivity": 0.4,
                    "disease_resistance": 0.75
                },
                "appeal": {
                    "beauty": 6,
                    "rarity_bonus": 1,
                    "visitor_attraction": 4
                }
            },
            {
                "id": "betta",
                "name": "ベタ",
                "name_en": "Betta",
                "description": "美しいヒレを持つ闘魚。単独飼育が基本で、個性的な色彩が魅力。",
                "category": "freshwater",
                "rarity": "common",
                "base_price": 150,
                "sell_price": 80,
                "base_size": 3.0,
                "max_size": 7.0,
                "growth_rate": 0.006,
                "lifespan_days": 365,
                "requirements": {
                    "min_temp": 24.0,
                    "max_temp": 28.0,
                    "preferred_ph": 7.0,
                    "ph_tolerance": 1.0,
                    "min_tank_size": 5,
                    "compatibility": ["betta"]
                },
                "stats": {
                    "base_health": 85,
                    "hunger_rate": 4,
                    "stress_sensitivity": 0.8,
                    "disease_resistance": 0.6
                },
                "appeal": {
                    "beauty": 9,
                    "rarity_bonus": 2,
                    "visitor_attraction": 7
                }
            },
            {
                "id": "neon_tetra",
                "name": "ネオンテトラ",
                "name_en": "Neon Tetra",
                "description": "青と赤の鮮やかな小型魚。群れで泳ぐ姿が美しく、水草水槽の定番。",
                "category": "freshwater",
                "rarity": "common",
                "base_price": 30,
                "sell_price": 15,
                "base_size": 1.5,
                "max_size": 4.0,
                "growth_rate": 0.003,
                "lifespan_days": 730,
                "requirements": {
                    "min_temp": 20.0,
                    "max_temp": 26.0,
                    "preferred_ph": 6.0,
                    "ph_tolerance": 1.0,
                    "min_tank_size": 20,
                    "compatibility": ["tetra", "guppy", "rasbora", "corydoras"]
                },
                "stats": {
                    "base_health": 60,
                    "hunger_rate": 3,
                    "stress_sensitivity": 0.5,
                    "disease_resistance": 0.7
                },
                "appeal": {
                    "beauty": 7,
                    "rarity_bonus": 1,
                    "visitor_attraction": 5
                }
            },
            {
                "id": "discus",
                "name": "ディスカス",
                "name_en": "Discus",
                "description": "熱帯魚の王様と呼ばれる高級魚。円盤型の体と美しい模様が特徴。飼育難易度は高い。",
                "category": "freshwater",
                "rarity": "rare",
                "base_price": 1000,
                "sell_price": 600,
                "base_size": 8.0,
                "max_size": 20.0,
                "growth_rate": 0.015,
                "lifespan_days": 3650,
                "requirements": {
                    "min_temp": 28.0,
                    "max_temp": 31.0,
                    "preferred_ph": 6.0,
                    "ph_tolerance": 0.5,
                    "min_tank_size": 80,
                    "compatibility": ["discus", "tetra", "corydoras"]
                },
                "stats": {
                    "base_health": 120,
                    "hunger_rate": 6,
                    "stress_sensitivity": 0.9,
                    "disease_resistance": 0.5
                },
                "appeal": {
                    "beauty": 10,
                    "rarity_bonus": 5,
                    "visitor_attraction": 15
                }
            },
            {
                "id": "pleco",
                "name": "プレコ",
                "name_en": "Plecostomus",
                "description": "底棲のコケ取り魚。水槽の掃除屋として重宝される。大きく育つ。",
                "category": "freshwater",
                "rarity": "common",
                "base_price": 200,
                "sell_price": 100,
                "base_size": 5.0,
                "max_size": 30.0,
                "growth_rate": 0.018,
                "lifespan_days": 3650,
                "requirements": {
                    "min_temp": 22.0,
                    "max_temp": 28.0,
                    "preferred_ph": 7.0,
                    "ph_tolerance": 1.5,
                    "min_tank_size": 50,
                    "compatibility": ["pleco", "cichlid", "catfish"]
                },
                "stats": {
                    "base_health": 130,
                    "hunger_rate": 5,
                    "stress_sensitivity": 0.3,
                    "disease_resistance": 0.85
                },
                "appeal": {
                    "beauty": 6,
                    "rarity_bonus": 1,
                    "visitor_attraction": 5
                }
            },
            {
                "id": "shrimp",
                "name": "エビ",
                "name_en": "Shrimp",
                "description": "小型の淡水エビ。透明な体と活発な動きが魅力。コケ取りにも役立つ。",
                "category": "freshwater",
                "rarity": "common",
                "base_price": 80,
                "sell_price": 40,
                "base_size": 1.0,
                "max_size": 3.0,
                "growth_rate": 0.002,
                "lifespan_days": 365,
                "requirements": {
                    "min_temp": 18.0,
                    "max_temp": 26.0,
                    "preferred_ph": 7.0,
                    "ph_tolerance": 1.0,
                    "min_tank_size": 10,
                    "compatibility": ["shrimp", "tetra", "guppy", "snail"]
                },
                "stats": {
                    "base_health": 50,
                    "hunger_rate": 2,
                    "stress_sensitivity": 0.7,
                    "disease_resistance": 0.6
                },
                "appeal": {
                    "beauty": 5,
                    "rarity_bonus": 1,
                    "visitor_attraction": 3
                }
            },
            {
                "id": "oscar",
                "name": "オスカー",
                "name_en": "Oscar",
                "description": "大型で知能の高い肉食魚。人に懐き、餌をねだる姿がかわいい。",
                "category": "freshwater",
                "rarity": "uncommon",
                "base_price": 400,
                "sell_price": 240,
                "base_size": 10.0,
                "max_size": 35.0,
                "growth_rate": 0.025,
                "lifespan_days": 3650,
                "requirements": {
                    "min_temp": 23.0,
                    "max_temp": 27.0,
                    "preferred_ph": 7.0,
                    "ph_tolerance": 1.0,
                    "min_tank_size": 150,
                    "compatibility": ["oscar", "pleco"]
                },
                "stats": {
                    "base_health": 140,
                    "hunger_rate": 10,
                    "stress_sensitivity": 0.5,
                    "disease_resistance": 0.75
                },
                "appeal": {
                    "beauty": 7,
                    "rarity_bonus": 3,
                    "visitor_attraction": 9
                }
            },
            {
                "id": "cichlid",
                "name": "シクリッド",
                "name_en": "African Cichlid",
                "description": "アフリカ原産の色鮮やかな魚。多様な種類と美しい色彩が魅力。縄張り意識が強い。",
                "category": "freshwater",
                "rarity": "uncommon",
                "base_price": 350,
                "sell_price": 200,
                "base_size": 6.0,
                "max_size": 15.0,
                "growth_rate": 0.012,
                "lifespan_days": 2555,
                "requirements": {
                    "min_temp": 24.0,
                    "max_temp": 28.0,
                    "preferred_ph": 7.8,
                    "ph_tolerance": 0.8,
                    "min_tank_size": 60,
                    "compatibility": ["cichlid", "pleco"]
                },
                "stats": {
                    "base_health": 110,
                    "hunger_rate": 7,
                    "stress_sensitivity": 0.6,
                    "disease_resistance": 0.75
                },
                "appeal": {
                    "beauty": 8,
                    "rarity_bonus": 3,
                    "visitor_attraction": 9
                }
            },
            {
                "id": "catfish",
                "name": "ナマズ",
                "name_en": "Catfish",
                "description": "底棲の大型魚。ひげが特徴的で、夜行性。水槽の掃除屋として活躍。",
                "category": "freshwater",
                "rarity": "common",
                "base_price": 180,
                "sell_price": 90,
                "base_size": 8.0,
                "max_size": 40.0,
                "growth_rate": 0.02,
                "lifespan_days": 3650,
                "requirements": {
                    "min_temp": 20.0,
                    "max_temp": 26.0,
                    "preferred_ph": 7.0,
                    "ph_tolerance": 1.5,
                    "min_tank_size": 100,
                    "compatibility": ["catfish", "pleco", "loach"]
                },
                "stats": {
                    "base_health": 135,
                    "hunger_rate": 6,
                    "stress_sensitivity": 0.3,
                    "disease_resistance": 0.85
                },
                "appeal": {
                    "beauty": 5,
                    "rarity_bonus": 1,
                    "visitor_attraction": 4
                }
            },
            {
                "id": "loach",
                "name": "ドジョウ",
                "name_en": "Loach",
                "description": "日本の淡水魚。底を這う動きがユニーク。丈夫で飼いやすい。",
                "category": "freshwater",
                "rarity": "common",
                "base_price": 120,
                "sell_price": 60,
                "base_size": 5.0,
                "max_size": 15.0,
                "growth_rate": 0.008,
                "lifespan_days": 1825,
                "requirements": {
                    "min_temp": 15.0,
                    "max_temp": 25.0,
                    "preferred_ph": 7.0,
                    "ph_tolerance": 1.5,
                    "min_tank_size": 30,
                    "compatibility": ["loach", "goldfish", "koi", "catfish"]
                },
                "stats": {
                    "base_health": 100,
                    "hunger_rate": 4,
                    "stress_sensitivity": 0.3,
                    "disease_resistance": 0.85
                },
                "appeal": {
                    "beauty": 5,
                    "rarity_bonus": 1,
                    "visitor_attraction": 4
                }
            },
            {
                "id": "arowana",
                "name": "アロワナ",
                "name_en": "Arowana",
                "description": "古代魚として知られる高級魚。龍のような姿が美しく、幸運をもたらすとされる。",
                "category": "freshwater",
                "rarity": "legendary",
                "base_price": 5000,
                "sell_price": 3000,
                "base_size": 20.0,
                "max_size": 90.0,
                "growth_rate": 0.03,
                "lifespan_days": 7300,
                "requirements": {
                    "min_temp": 24.0,
                    "max_temp": 30.0,
                    "preferred_ph": 6.5,
                    "ph_tolerance": 1.0,
                    "min_tank_size": 300,
                    "compatibility": ["arowana"]
                },
                "stats": {
                    "base_health": 200,
                    "hunger_rate": 12,
                    "stress_sensitivity": 0.7,
                    "disease_resistance": 0.7
                },
                "appeal": {
                    "beauty": 10,
                    "rarity_bonus": 10,
                    "visitor_attraction": 25
                }
            }
        ]
    }

# Save to file for reference
with open('/tmp/fish_species_complete.json', 'w', encoding='utf-8') as f:
    json.dump(generate_phase4_fish_data(), f, indent=2, ensure_ascii=False)

print("Generated fish_species.json with 15 species - saved to /tmp/fish_species_complete.json")
print(f"File size: {os.path.getsize('/tmp/fish_species_complete.json')} bytes")
