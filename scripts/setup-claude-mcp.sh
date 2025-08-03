#!/bin/bash

# Claude Desktop MCP セットアップスクリプト
# ココフォリア MCP Workers を Claude Desktop に統合

set -e

echo "🤖 Claude Desktop MCP セットアップ開始"
echo ""

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 現在のディレクトリを保存
PROJECT_DIR=$(pwd)

# Claude Desktop の設定ディレクトリを特定
detect_claude_config_dir() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        CONFIG_DIR="$HOME/Library/Application Support/Claude"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        CONFIG_DIR="$APPDATA/Claude"
    else
        # Linux
        CONFIG_DIR="$HOME/.config/Claude"
    fi
    
    echo "$CONFIG_DIR"
}

# Worker URLを取得
get_worker_url() {
    print_step "Cloudflare Workers URLを確認中..."
    
    # wrangler.tomlから名前を取得
    if [ -f "wrangler.toml" ]; then
        WORKER_NAME=$(grep -E '^name\s*=' wrangler.toml | sed 's/name\s*=\s*"\([^"]*\)".*/\1/')
        if [ ! -z "$WORKER_NAME" ]; then
            echo "https://$WORKER_NAME.workers.dev"
            return
        fi
    fi
    
    # デフォルト値
    echo "https://ccfolia-mcp-api.workers.dev"
}

# Claude Desktop設定ディレクトリの作成
CONFIG_DIR=$(detect_claude_config_dir)
print_step "Claude Desktop設定ディレクトリ: $CONFIG_DIR"

if [ ! -d "$CONFIG_DIR" ]; then
    print_step "Claude Desktop設定ディレクトリを作成中..."
    mkdir -p "$CONFIG_DIR"
    print_success "設定ディレクトリを作成しました"
fi

# 依存関係インストール
print_step "MCP SDK依存関係をインストール中..."
npm install @modelcontextprotocol/sdk

# Worker URLを取得
WORKER_URL=$(get_worker_url)
print_step "Worker URL: $WORKER_URL"

# Claude Desktop設定ファイルの作成/更新
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
print_step "Claude Desktop設定ファイルを更新中..."

# 既存の設定ファイルをバックアップ
if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    print_warning "既存の設定ファイルをバックアップしました"
fi

# 設定ファイル作成
cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "ccfolia-mcp": {
      "command": "node",
      "args": [
        "$PROJECT_DIR/mcp-server.js"
      ],
      "env": {
        "WORKER_URL": "$WORKER_URL"
      }
    }
  }
}
EOF

print_success "Claude Desktop設定ファイルを更新しました"

# 動作確認用テストスクリプト作成
cat > "$PROJECT_DIR/test-mcp.js" << 'EOF'
#!/usr/bin/env node

// Claude Desktop MCP接続テスト

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Claude Desktop MCP接続テスト開始');

const mcpServer = spawn('node', [path.join(__dirname, 'mcp-server.js')], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// 初期化メッセージ送信
const initMessage = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "test-client",
      version: "1.0.0"
    }
  }
};

mcpServer.stdin.write(JSON.stringify(initMessage) + '\n');

// レスポンス受信
mcpServer.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  lines.forEach(line => {
    try {
      const response = JSON.parse(line);
      console.log('📨 レスポンス:', JSON.stringify(response, null, 2));
      
      if (response.id === 1) {
        // 初期化成功後、ツール一覧取得
        const listToolsMessage = {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/list"
        };
        mcpServer.stdin.write(JSON.stringify(listToolsMessage) + '\n');
      } else if (response.id === 2) {
        console.log('✅ MCP接続テスト成功！');
        mcpServer.kill();
      }
    } catch (error) {
      console.log('📄 非JSON出力:', line);
    }
  });
});

mcpServer.on('error', (error) => {
  console.error('❌ MCPサーバーエラー:', error);
});

mcpServer.on('close', (code) => {
  console.log('🔚 MCPサーバー終了 (コード:', code, ')');
});

// 10秒後にタイムアウト
setTimeout(() => {
  console.log('⏰ テストタイムアウト');
  mcpServer.kill();
}, 10000);
EOF

chmod +x "$PROJECT_DIR/test-mcp.js"

# 完了メッセージ
echo ""
echo "🎉 Claude Desktop MCP セットアップ完了！"
echo ""
echo "📋 設定内容:"
echo "  - 設定ファイル: $CONFIG_FILE"
echo "  - Worker URL: $WORKER_URL"
echo "  - MCPサーバー: $PROJECT_DIR/mcp-server.js"
echo ""
echo "🚀 使用手順:"
echo "  1. Claude Desktop を再起動"
echo "  2. 新しいチャットを開始"
echo "  3. 以下のようにツールを使用:"
echo ""
echo "     「田中太郎という探偵キャラクターを生成して」"
echo "     「学校の怪奇現象シナリオ用にNPCを3体生成して」"
echo "     「セッション分析をして」"
echo ""
echo "🧪 テスト実行:"
echo "  ./test-mcp.js"
echo ""
echo "💡 トラブルシューティング:"
echo "  - Claude Desktopを完全に再起動してください"
echo "  - Worker URLが正しいか確認してください"
echo "  - ログは Claude Desktop の開発者ツールで確認できます"
echo ""

# Worker URL の確認
print_step "Worker URL接続確認中..."
if curl -s --max-time 10 "$WORKER_URL/health" > /dev/null 2>&1; then
    print_success "Worker URL接続確認成功"
else
    print_warning "Worker URLに接続できません"
    echo "Worker をデプロイしてから再度お試しください:"
    echo "  npm run deploy"
fi

echo ""
echo "🎲 Happy Gaming with Claude! ✨"
