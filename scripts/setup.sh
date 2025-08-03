#!/bin/bash

# セットアップスクリプト
# 開発環境の初期セットアップを行います

set -e

echo "🔧 ココフォリア MCP Workers 開発環境セットアップ"
echo ""

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 関数定義
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

# 前提条件チェック
print_step "前提条件をチェック中..."

if ! command -v node &> /dev/null; then
    print_error "Node.js が見つかりません"
    echo "https://nodejs.org/ からインストールしてください"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm が見つかりません"
    echo "Node.js と一緒にインストールされます"
    exit 1
fi

if ! command -v git &> /dev/null; then
    print_error "Git が見つかりません"
    echo "https://git-scm.com/ からインストールしてください"
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js $NODE_VERSION が見つかりました"

# 依存関係インストール
print_step "依存関係をインストール中..."
npm install

# Wrangler CLI インストール確認
if ! command -v wrangler &> /dev/null; then
    print_warning "Wrangler CLI が見つかりません。インストールしますか？ (y/n)"
    read -p "" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "Wrangler CLI をインストール中..."
        npm install -g wrangler
        print_success "Wrangler CLI をインストールしました"
    else
        print_warning "Wrangler CLI はスキップされました"
        echo "後で 'npm install -g wrangler' でインストールできます"
    fi
else
    WRANGLER_VERSION=$(wrangler --version)
    print_success "Wrangler CLI $WRANGLER_VERSION が見つかりました"
fi

# 環境設定
print_step "環境設定をチェック中..."

if [ ! -f ".env" ]; then
    print_step ".env ファイルを作成中..."
    cat > .env << EOF
# 開発環境用設定
ENVIRONMENT=development

# Cloudflare設定（本番デプロイ時に設定）
# CLOUDFLARE_ACCOUNT_ID=your-account-id
# CLOUDFLARE_API_TOKEN=your-api-token

# その他の設定
DEBUG=true
EOF
    print_success ".env ファイルを作成しました"
else
    print_success ".env ファイルが存在します"
fi

# Git設定チェック
print_step "Git設定をチェック中..."

if [ ! -d ".git" ]; then
    print_warning "Gitリポジトリが初期化されていません"
    echo "初期化しますか？ (y/n)"
    read -p "" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git init
        git add .
        git commit -m "Initial commit"
        print_success "Gitリポジトリを初期化しました"
    fi
else
    print_success "Gitリポジトリが存在します"
fi

# .gitignore確認
if [ ! -f ".gitignore" ]; then
    print_step ".gitignore ファイルを作成中..."
    cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment files
.env
.env.local
.env.production

# Build outputs
dist/
.wrangler/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp

# Logs
logs/
*.log
EOF
    print_success ".gitignore ファイルを作成しました"
fi

# 開発用スクリプトのPermission設定
print_step "スクリプトの実行権限を設定中..."
chmod +x scripts/*.sh
print_success "スクリプトの実行権限を設定しました"

# TypeScript設定チェック
print_step "TypeScript設定をチェック中..."
if npx tsc --noEmit; then
    print_success "TypeScript設定は正常です"
else
    print_warning "TypeScript設定に問題があります"
fi

# 開発サーバーテスト
print_step "開発環境のテスト準備完了チェック..."

echo ""
echo "🎉 セットアップ完了！"
echo ""
echo "📋 次のステップ:"
echo "  1. 開発サーバー起動: npm run dev"
echo "  2. APIテスト実行: ./scripts/test-api.sh"
echo "  3. Cloudflareログイン: wrangler auth login"
echo "  4. 本番デプロイ: npm run deploy"
echo ""
echo "💡 便利なコマンド:"
echo "  - npm run dev          # 開発サーバー起動"
echo "  - npm run deploy       # Cloudflareにデプロイ"
echo "  - npm run tail         # ログ確認"
echo "  - npm test             # APIテスト実行"
echo "  - ./scripts/test-api.sh # 詳細APIテスト"
echo ""
echo "📚 ドキュメント:"
echo "  - README.md           # プロジェクト概要"
echo "  - src/                # ソースコード"
echo "  - scripts/            # ユーティリティスクリプト"
echo ""

# Cloudflare認証確認
if command -v wrangler &> /dev/null; then
    print_step "Cloudflare認証状態をチェック中..."
    if wrangler whoami &> /dev/null; then
        USER_EMAIL=$(wrangler whoami | head -n 1)
        print_success "Cloudflareにログイン済み: $USER_EMAIL"
    else
        print_warning "Cloudflareにログインしていません"
        echo "デプロイ前に 'wrangler auth login' を実行してください"
    fi
fi

echo ""
echo "🚀 開発を開始する準備ができました！"
echo "   まずは 'npm run dev' で開発サーバーを起動してみてください"
