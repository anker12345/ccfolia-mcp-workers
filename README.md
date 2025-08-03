# ココフォリア MCP Workers

TRPGオンラインセッションツール「ココフォリア」用のMCP API (Cloudflare Workers版)

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/USERNAME/ccfolia-mcp-workers)

## 🚀 クイックスタート

### ワンライナーデプロイ
```bash
curl -sSL https://raw.githubusercontent.com/USERNAME/ccfolia-mcp-workers/main/scripts/deploy.sh | bash
```

### 手動デプロイ
```bash
git clone https://github.com/USERNAME/ccfolia-mcp-workers.git
cd ccfolia-mcp-workers
npm install
npm run deploy
```

### GitHub Actionsで自動デプロイ
```bash
# プッシュするだけで自動デプロイ
git push origin main
# → GitHub Actionsが自動でCloudflareにデプロイ
```

## 🎮 機能

- **キャラクター生成**: TRPGキャラクターの自動生成
- **NPC一括生成**: シナリオに応じたNPC群の生成
- **セッション分析**: 進行状況の自動分析
- **ランダムイベント**: 状況に応じたイベント生成
- **ルール支援**: ルール説明とコマンド提案

## 📡 API エンドポイント

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/health` | GET | ヘルスチェック |
| `/generate_character` | POST | キャラクター生成 |
| `/generate_npc_batch` | POST | NPC一括生成 |
| `/analyze_session` | POST | セッション分析 |
| `/generate_random_event` | POST | ランダムイベント生成 |
| `/get_rule_help` | POST | ルール支援 |

## 🎯 ココフォリア設定

カスタムスクリプトで以下を設定:

```javascript
const MCP_SERVER_URL = "https://your-worker.workers.dev";

// チャットコマンドとして使用
async function mcpCommand(command, ...args) {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/${command}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: args })
    });
    const data = await response.json();
    return data.success ? data.data : data.error;
  } catch (error) {
    return `エラー: ${error.message}`;
  }
}

// 使用例
// /mcp character 田中太郎 30 探偵
// /mcp npc "学校の怪奇現象" 3
// /mcp analyze
```

## 💡 使用例

### キャラクター生成
```bash
curl -X POST https://your-worker.workers.dev/generate_character \
  -H "Content-Type: application/json" \
  -d '{
    "name": "田中太郎",
    "age": 30,
    "profession": "探偵",
    "background": "元警察官"
  }'
```

### NPC一括生成
```bash
curl -X POST https://your-worker.workers.dev/generate_npc_batch \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "学校の怪奇現象",
    "count": 3,
    "difficulty": "normal"
  }'
```

### セッション分析
```bash
curl -X POST https://your-worker.workers.dev/analyze_session \
  -H "Content-Type: application/json" \
  -d '{
    "chatLogs": [...],
    "playerActions": [...],
    "sessionTime": 3600000
  }'
```

## 🛠️ 開発

### 環境構築
```bash
git clone https://github.com/USERNAME/ccfolia-mcp-workers.git
cd ccfolia-mcp-workers
./scripts/setup.sh
```

### 開発サーバー起動
```bash
npm run dev
```

### テスト実行
```bash
# APIテスト
npm test

# 詳細テスト
./scripts/test-api.sh

# パフォーマンステスト
./scripts/test-api.sh http://localhost:8787 --performance
```

### デプロイ
```bash
# Cloudflareログイン
wrangler auth login

# デプロイ
npm run deploy

# ログ確認
npm run tail
```

## 📁 プロジェクト構成

```
ccfolia-mcp-workers/
├── 📁 .github/workflows/    # GitHub Actions設定
├── 📁 src/                  # ソースコード
│   ├── 📄 index.ts          # メインAPIコード
│   ├── 📄 character-generator.ts  # キャラ生成ロジック
│   ├── 📄 npc-generator.ts  # NPC生成ロジック
│   └── 📄 session-analyzer.ts    # セッション分析
├── 📁 scripts/              # ユーティリティスクリプト
│   ├── 📄 deploy.sh         # デプロイスクリプト
│   ├── 📄 setup.sh          # 環境セットアップ
│   └── 📄 test-api.sh       # APIテストスクリプト
├── 📄 wrangler.toml         # Cloudflare設定
├── 📄 package.json          # 依存関係
├── 📄 tsconfig.json         # TypeScript設定
└── 📄 README.md             # このファイル
```

## 🔧 設定

### 環境変数
- `ENVIRONMENT`: 実行環境 (development/staging/production)
- `CLOUDFLARE_API_TOKEN`: Cloudflare APIトークン
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare アカウントID

### wrangler.toml
```toml
name = "ccfolia-mcp-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "production"
```

## 🎲 対応シナリオ

### 事前定義シナリオ
- **学校の怪奇現象**: 学園ホラー系のNPC・イベント生成
- **村の失踪事件**: 田舎ミステリー系
- **古い屋敷の謎**: クラシックホラー系
- **都市の地下組織**: 現代サスペンス系
- **遺跡探索**: 冒険・ファンタジー系

### カスタムシナリオ
独自のシナリオにも対応。汎用的なNPC・イベント生成機能を使用。

## 📊 セッション分析機能

### 分析項目
- **プレイヤーエンゲージメント**: 参加度・発言バランス
- **ストーリー進行**: フェーズ検出・進行速度
- **ゲームプレイメトリクス**: ダイス使用・成功率
- **改善提案**: データに基づく具体的なアドバイス

### 出力例
```
【セッション分析レポート】
セッション時間: 2時間30分
参加プレイヤー: 4名
全体エンゲージメント: 高
現在フェーズ: 調査段階

【改善提案】
・田中太郎プレイヤーの参加を促してください
・そろそろクライマックスへの展開を検討してください
```

## 🚀 パフォーマンス

- **レスポンス時間**: 平均 < 200ms
- **可用性**: 99.9%+ (Cloudflare Workers)
- **同時接続**: 無制限
- **データ転送**: 無料枠内で十分

## 🔐 セキュリティ

- CORS対応済み
- レート制限実装
- 入力値検証
- エラーハンドリング

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### 開発ガイドライン
- TypeScriptを使用
- ESLint/Prettierに従う
- テストを追加
- ドキュメントを更新

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 🙏 謝辞

- [ココフォリア](https://ccfolia.com/) - 素晴らしいTRPGツール
- [Cloudflare Workers](https://workers.cloudflare.com/) - 高性能なサーバーレス環境
- TRPGコミュニティの皆様

## 📞 サポート

- **Issues**: [GitHub Issues](https://github.com/USERNAME/ccfolia-mcp-workers/issues)
- **Discussions**: [GitHub Discussions](https://github.com/USERNAME/ccfolia-mcp-workers/discussions)
- **Discord**: [TRPGコミュニティサーバー](#)

## 🔄 更新履歴

### v1.0.0 (2024-XX-XX)
- 初回リリース
- 基本的なキャラクター生成機能
- NPC一括生成機能
- セッション分析機能

### 今後の予定
- [ ] AI モデル統合 (OpenAI/Claude)
- [ ] より詳細な分析機能
- [ ] カスタムルールシステム対応
- [ ] リアルタイム通知機能
- [ ] Web UI の提供

---

**Happy Gaming! 🎲✨**

*このプロジェクトがあなたのTRPGセッションをより楽しくすることを願っています！*
