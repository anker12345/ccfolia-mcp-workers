#!/bin/bash

# API テストスクリプト
# 使用方法: ./test-api.sh [BASE_URL]

set -e

# デフォルトURL（ローカル開発時）
BASE_URL=${1:-"http://localhost:8787"}

echo "🧪 ココフォリア MCP Workers API テスト開始"
echo "📡 テスト対象: $BASE_URL"
echo ""

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# テスト関数
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=${4:-200}
    
    echo -n "Testing $method $endpoint ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
            -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    body=$(echo "$response" | sed 's/HTTPSTATUS:.*//g')
    status=$(echo "$response" | grep -o "HTTPSTATUS:.*" | cut -d: -f2)
    
    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Status: $status)"
        if [ ! -z "$body" ] && [ "$body" != "null" ]; then
            echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
        fi
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $status)"
        echo "Response: $body"
        return 1
    fi
    echo ""
}

# テスト実行
echo "=== 基本エンドポイントテスト ==="

# ヘルスチェック
test_endpoint "GET" "/health"

# ルートエンドポイント
test_endpoint "GET" "/"

echo "=== キャラクター生成テスト ==="

# キャラクター生成（基本）
test_endpoint "POST" "/generate_character" '{
  "name": "田中太郎",
  "age": 30,
  "profession": "探偵",
  "background": "元警察官"
}'

# キャラクター生成（最小限）
test_endpoint "POST" "/generate_character" '{
  "name": "山田花子"
}'

echo "=== NPC一括生成テスト ==="

# NPC一括生成（学校の怪奇現象）
test_endpoint "POST" "/generate_npc_batch" '{
  "scenario": "学校の怪奇現象",
  "count": 3,
  "difficulty": "normal"
}'

# NPC一括生成（汎用）
test_endpoint "POST" "/generate_npc_batch" '{
  "scenario": "オリジナルシナリオ",
  "count": 2,
  "difficulty": "easy"
}'

echo "=== セッション分析テスト ==="

# セッション分析
test_endpoint "POST" "/analyze_session" '{
  "chatLogs": [
    {
      "timestamp": 1640995200000,
      "playerName": "田中太郎",
      "message": "現場を調査したいと思います",
      "type": "ic"
    },
    {
      "timestamp": 1640995260000,
      "playerName": "GM",
      "message": "調査判定をお願いします",
      "type": "system"
    }
  ],
  "playerActions": [
    {
      "timestamp": 1640995200000,
      "playerName": "田中太郎",
      "actionType": "investigation",
      "target": "現場",
      "success": true
    }
  ],
  "sessionTime": 3600000
}'

echo "=== ランダムイベント生成テスト ==="

# ランダムイベント生成（探索）
test_endpoint "POST" "/generate_random_event" '{
  "category": "exploration",
  "difficulty": "normal",
  "setting": "古い屋敷"
}'

# ランダムイベント生成（戦闘）
test_endpoint "POST" "/generate_random_event" '{
  "category": "combat",
  "difficulty": "hard"
}'

echo "=== ルール支援テスト ==="

# ルール支援（判定）
test_endpoint "POST" "/get_rule_help" '{
  "query": "判定",
  "system": "general"
}'

# ルール支援（戦闘）
test_endpoint "POST" "/get_rule_help" '{
  "query": "戦闘",
  "system": "general"
}'

echo "=== エラーハンドリングテスト ==="

# 存在しないエンドポイント
test_endpoint "GET" "/nonexistent" "" 404

# 不正なJSON
test_endpoint "POST" "/generate_character" 'invalid json' 400

# 必須パラメータなし
test_endpoint "POST" "/generate_character" '{}' 400

echo ""
echo "🎉 全テスト完了！"
echo ""

# パフォーマンステスト（オプション）
if [ "$2" = "--performance" ]; then
    echo "=== パフォーマンステスト ==="
    echo "10回連続でキャラクター生成を実行..."
    
    start_time=$(date +%s%N)
    for i in {1..10}; do
        curl -s -X POST \
            -H "Content-Type: application/json" \
            -d '{"name":"テスト'$i'"}' \
            "$BASE_URL/generate_character" > /dev/null
    done
    end_time=$(date +%s%N)
    
    duration=$((($end_time - $start_time) / 1000000))
    average=$(($duration / 10))
    
    echo "総時間: ${duration}ms"
    echo "平均時間: ${average}ms per request"
    echo ""
fi

echo "💡 Tips:"
echo "  - パフォーマンステスト: ./test-api.sh [URL] --performance"
echo "  - 本番環境テスト: ./test-api.sh https://your-worker.workers.dev"
echo "  - ローカル開発: wrangler dev してから ./test-api.sh"
