#!/bin/bash
set -e

echo "🚀 ココフォリア MCP Workers デプロイ開始"

# 前提条件チェック
check_prerequisites() {
    echo "🔍 前提条件をチェック中..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js が必要です: https://nodejs.org/"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        echo "❌ Git が必要です: https://git-scm.com/"
        exit 1
    fi
    
    echo "✅ 前提条件 OK"
}

# プロジェクト名入力
get_project_name() {
    read -p "📝 プロジェクト名 (デフォルト: ccfolia-mcp-api): " PROJECT_NAME
    PROJECT_NAME=${PROJECT_NAME:-ccfolia-mcp-api}
    echo "📁 プロジェクト名: $PROJECT_NAME"
}

# リポジトリクローン
clone_repository() {
    echo "📥 リポジトリをクローン中..."
    
    if [ -d "$PROJECT_NAME" ]; then
        echo "⚠️ ディレクトリが存在します。削除して続行..."
        rm -rf "$PROJECT_NAME"
    fi
    
    git clone https://github.com/USERNAME/ccfolia-mcp-workers.git "$PROJECT_NAME"
    cd "$PROJECT_NAME"
    
    echo "✅ クローン完了"
}

# 依存関係インストール
install_dependencies() {
    echo "📦 依存関係をインストール中..."
    npm install
    
    # Wrangler インストール確認
    if ! command -v wrangler &> /dev/null; then
        echo "📥 Wrangler をインストール中..."
        npm install -g wrangler
    fi
    
    echo "✅ インストール完了"
}

# Cloudflare認証
authenticate_cloudflare() {
    echo "🔐 Cloudflare 認証確認中..."
    
    if ! wrangler whoami &> /dev/null; then
        echo "🌐 Cloudflare にログインしてください..."
        wrangler auth login
    fi
    
    USER_EMAIL=$(wrangler whoami | head -n 1 | cut -d' ' -f2)
    echo "✅ ログイン中: $USER_EMAIL"
}

# wrangler.toml 更新
update_config() {
    echo "⚙️ 設定を更新中..."
    
    # プロジェクト名を設定ファイルに反映
    sed -i.bak "s/name = \".*\"/name = \"$PROJECT_NAME\"/" wrangler.toml
    rm -f wrangler.toml.bak
    
    echo "✅ 設定更新完了"
}

# デプロイ実行
deploy_to_cloudflare() {
    echo "🚀 Cloudflare Workers にデプロイ中..."
    
    DEPLOY_OUTPUT=$(npm run deploy 2>&1)
    
    if echo "$DEPLOY_OUTPUT" | grep -q "deployment successful"; then
        WORKER_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^[:space:]]*\.workers\.dev' | head -n 1)
        
        echo "✅ デプロイ成功！"
        echo "🌐 API URL: $WORKER_URL"
        
        return 0
    else
        echo "❌ デプロイに失敗しました"
        echo "$DEPLOY_OUTPUT"
        return 1
    fi
}

# 動作確認
test_deployment() {
    echo "🧪 動作確認中..."
    
    if [ ! -z "$WORKER_URL" ]; then
        sleep 5  # デプロイ完了待ち
        
        if curl -s "$WORKER_URL/health" > /dev/null 2>&1; then
            echo "✅ ヘルスチェック成功"
            
            echo ""
            echo "📊 API レスポンス:"
            curl -s "$WORKER_URL/health" | python3 -m json.tool 2>/dev/null || echo "レスポンス取得成功"
            
        else
            echo "⚠️ ヘルスチェック失敗（数分後に再試行してください）"
        fi
    fi
}

# ココフォリア設定情報表示
show_ccfolia_config() {
    echo ""
    echo "🎮 ココフォリア設定用情報"
    echo "=================================="
    echo "const MCP_SERVER_URL = \"$WORKER_URL\";"
    echo "=================================="
    echo ""
    echo "📝 次のステップ:"
    echo "1. 上記URLをココフォリアのカスタムスクリプトに設定"
    echo "2. /mcp status でテスト実行"
    echo "3. /mcp help でコマンド確認"
    echo ""
    echo "🎯 使用例:"
    echo "  /mcp character 田中太郎 30 探偵"
    echo "  /mcp npc '学校の怪奇現象' 3"
    echo "  /mcp analyze"
}

# メイン実行
main() {
    check_prerequisites
    get_project_name
    clone_repository
    install_dependencies
    authenticate_cloudflare
    update_config
    
    if deploy_to_cloudflare; then
        test_deployment
        show_ccfolia_config
        
        echo ""
        echo "🎉 セットアップ完了！"
        echo "🎮 Happy Gaming! 🎲"
    else
        echo "💥 デプロイに失敗しました"
        exit 1
    fi
}

# スクリプト実行
main "$@"
