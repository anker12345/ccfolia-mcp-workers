# Claude Desktop MCP セットアップスクリプト (Windows PowerShell版)
# ココフォリア MCP Workers を Claude Desktop に統合

param(
    [string]$WorkerUrl = ""
)

Write-Host "🤖 Claude Desktop MCP セットアップ開始" -ForegroundColor Blue
Write-Host ""

# 現在のディレクトリを保存
$ProjectDir = Get-Location

# Claude Desktop の設定ディレクトリ
$ConfigDir = "$env:APPDATA\Claude"
$ConfigFile = "$ConfigDir\claude_desktop_config.json"

Write-Host "▶ Claude Desktop設定ディレクトリ: $ConfigDir" -ForegroundColor Blue

# 設定ディレクトリが存在しない場合は作成
if (!(Test-Path $ConfigDir)) {
    Write-Host "▶ Claude Desktop設定ディレクトリを作成中..." -ForegroundColor Blue
    New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
    Write-Host "✅ 設定ディレクトリを作成しました" -ForegroundColor Green
}

# Worker URLを取得
if ([string]::IsNullOrEmpty($WorkerUrl)) {
    Write-Host "▶ wrangler.tomlからWorker URLを取得中..." -ForegroundColor Blue
    if (Test-Path "wrangler.toml") {
        $WranglerContent = Get-Content "wrangler.toml"
        $NameLine = $WranglerContent | Where-Object { $_ -match '^name\s*=' }
        if ($NameLine) {
            $WorkerName = ($NameLine -split '"')[1]
            $WorkerUrl = "https://$WorkerName.workers.dev"
        }
    }
    
    if ([string]::IsNullOrEmpty($WorkerUrl)) {
        $WorkerUrl = "https://ccfolia-mcp-api.workers.dev"
    }
}

Write-Host "▶ Worker URL: $WorkerUrl" -ForegroundColor Blue

# 依存関係インストール
Write-Host "▶ MCP SDK依存関係をインストール中..." -ForegroundColor Blue
npm install @modelcontextprotocol/sdk

# 既存の設定ファイルをバックアップ
if (Test-Path $ConfigFile) {
    $BackupFile = "$ConfigFile.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $ConfigFile $BackupFile
    Write-Host "⚠️ 既存の設定ファイルをバックアップしました: $BackupFile" -ForegroundColor Yellow
}

# 設定ファイル作成
$ConfigContent = @{
    mcpServers = @{
        "ccfolia-mcp" = @{
            command = "node"
            args = @("$ProjectDir\mcp-server.js")
            env = @{
                WORKER_URL = $WorkerUrl
            }
        }
    }
} | ConvertTo-Json -Depth 10

$ConfigContent | Out-File -FilePath $ConfigFile -Encoding UTF8

Write-Host "✅ Claude Desktop設定ファイルを更新しました" -ForegroundColor Green

# テストスクリプト作成
$TestScript = @'
#!/usr/bin/env node

// Claude Desktop MCP接続テスト (Windows版)

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
'@

$TestScript | Out-File -FilePath "$ProjectDir\test-mcp.js" -Encoding UTF8

Write-Host ""
Write-Host "🎉 Claude Desktop MCP セットアップ完了！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 設定内容:"
Write-Host "  - 設定ファイル: $ConfigFile"
Write-Host "  - Worker URL: $WorkerUrl"
Write-Host "  - MCPサーバー: $ProjectDir\mcp-server.js"
Write-Host ""
Write-Host "🚀 使用手順:"
Write-Host "  1. Claude Desktop を再起動"
Write-Host "  2. 新しいチャットを開始"
Write-Host "  3. 以下のようにツールを使用:"
Write-Host ""
Write-Host "     「田中太郎という探偵キャラクターを生成して」"
Write-Host "     「学校の怪奇現象シナリオ用にNPCを3体生成して」"
Write-Host "     「セッション分析をして」"
Write-Host ""
Write-Host "🧪 テスト実行:"
Write-Host "  node test-mcp.js"
Write-Host ""
Write-Host "💡 トラブルシューティング:"
Write-Host "  - Claude Desktopを完全に再起動してください"
Write-Host "  - Worker URLが正しいか確認してください"
Write-Host "  - 開発者ツール (Ctrl+Shift+I) でログを確認できます"
Write-Host ""

# Worker URL の確認
Write-Host "▶ Worker URL接続確認中..." -ForegroundColor Blue
try {
    $Response = Invoke-WebRequest -Uri "$WorkerUrl/health" -TimeoutSec 10 -UseBasicParsing
    if ($Response.StatusCode -eq 200) {
        Write-Host "✅ Worker URL接続確認成功" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Worker URLに接続できません (Status: $($Response.StatusCode))" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Worker URLに接続できません" -ForegroundColor Yellow
    Write-Host "Worker をデプロイしてから再度お試しください:"
    Write-Host "  npm run deploy"
}

Write-Host ""
Write-Host "🎲 Happy Gaming with Claude! ✨" -ForegroundColor Magenta
