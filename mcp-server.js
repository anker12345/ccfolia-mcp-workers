#!/usr/bin/env node

/**
 * Claude Desktop用 MCP サーバーラッパー
 * Cloudflare WorkersのAPIをMCPプロトコルでラップ
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// Cloudflare Workers APIのベースURL
const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8787';

// サーバー初期化
const server = new Server(
  {
    name: "ccfolia-mcp-workers",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツール一覧定義
const TOOLS = [
  {
    name: "generate_character",
    description: "TRPGキャラクターを生成します",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "キャラクター名" },
        age: { type: "number", description: "年齢" },
        profession: { type: "string", description: "職業" },
        background: { type: "string", description: "背景設定" }
      },
      required: ["name"]
    }
  },
  {
    name: "generate_npc_batch",
    description: "シナリオに応じたNPC群を一括生成します",
    inputSchema: {
      type: "object",
      properties: {
        scenario: { type: "string", description: "シナリオ名" },
        count: { type: "number", description: "生成するNPC数", default: 3 },
        difficulty: { type: "string", description: "難易度", enum: ["easy", "normal", "hard"], default: "normal" }
      },
      required: ["scenario"]
    }
  },
  {
    name: "analyze_session",
    description: "TRPGセッションの進行状況を分析します",
    inputSchema: {
      type: "object",
      properties: {
        chatLogs: { 
          type: "array", 
          description: "チャットログ",
          items: {
            type: "object",
            properties: {
              timestamp: { type: "number" },
              playerName: { type: "string" },
              message: { type: "string" },
              type: { type: "string", enum: ["ic", "ooc", "system", "dice"] }
            }
          }
        },
        playerActions: {
          type: "array",
          description: "プレイヤーアクション",
          items: {
            type: "object",
            properties: {
              timestamp: { type: "number" },
              playerName: { type: "string" },
              actionType: { type: "string" },
              success: { type: "boolean" }
            }
          }
        },
        sessionTime: { type: "number", description: "セッション時間（ミリ秒）" }
      },
      required: ["chatLogs", "sessionTime"]
    }
  },
  {
    name: "generate_random_event",
    description: "ランダムイベントを生成します",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "イベントカテゴリ", enum: ["exploration", "social", "combat"], default: "general" },
        difficulty: { type: "string", description: "難易度", enum: ["easy", "normal", "hard"], default: "normal" },
        setting: { type: "string", description: "場面設定" }
      }
    }
  },
  {
    name: "get_rule_help",
    description: "TRPGルールの説明を取得します",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "質問内容" },
        system: { type: "string", description: "ルールシステム", default: "general" }
      },
      required: ["query"]
    }
  }
];

// ツール一覧返却ハンドラー
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS
  };
});

// ツール実行ハンドラー
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    // Cloudflare Workers APIに転送
    const response = await fetch(`${WORKER_URL}/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    // 結果を文字列として整形
    let content = '';
    
    switch (name) {
      case 'generate_character':
        content = formatCharacterResult(data.data);
        break;
      case 'generate_npc_batch':
        content = formatNPCBatchResult(data.data);
        break;
      case 'analyze_session':
        content = formatAnalysisResult(data.data);
        break;
      case 'generate_random_event':
        content = formatEventResult(data.data);
        break;
      case 'get_rule_help':
        content = formatRuleHelpResult(data.data);
        break;
      default:
        content = JSON.stringify(data.data, null, 2);
    }

    return {
      content: [
        {
          type: "text",
          text: content
        }
      ]
    };

  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `エラーが発生しました: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// 結果フォーマット関数群
function formatCharacterResult(character) {
  return `【生成されたキャラクター】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
名前: ${character.name}
年齢: ${character.age}歳
職業: ${character.profession}
背景: ${character.background}

【能力値】
STR: ${character.stats.STR}  DEX: ${character.stats.DEX}  CON: ${character.stats.CON}
INT: ${character.stats.INT}  WIS: ${character.stats.WIS}  CHA: ${character.stats.CHA}
HP: ${character.stats.HP}   MP: ${character.stats.MP}

【技能】
${character.skills.join(', ')}

【所持品】
${character.items.join(', ')}

【人物像】
外見: ${character.appearance}
性格: ${character.personality}
動機: ${character.motivation}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

function formatNPCBatchResult(result) {
  let output = `【${result.scenario} - NPC一括生成結果】\n`;
  output += `生成数: ${result.count}体\n\n`;
  
  result.npcs.forEach((npc, index) => {
    output += `【NPC ${index + 1}: ${npc.name}】\n`;
    output += `役職: ${npc.role}\n`;
    output += `居場所: ${npc.location}\n`;
    output += `外見: ${npc.appearance}\n`;
    output += `性格: ${npc.personality}\n`;
    output += `動機: ${npc.motivation}\n`;
    output += `秘密/フック: ${npc.secretOrHook}\n`;
    output += `脅威度: ${npc.stats.threat} (Lv.${npc.stats.level}, HP: ${npc.stats.hp})\n\n`;
  });
  
  return output;
}

function formatAnalysisResult(analysis) {
  const formatDuration = (ms) => {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}時間${minutes}分`;
  };

  return `【セッション分析結果】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【基本統計】
セッション時間: ${formatDuration(analysis.overview.totalDuration)}
総メッセージ数: ${analysis.overview.totalMessages}
参加プレイヤー数: ${analysis.overview.activePlayers}
メッセージ頻度: ${analysis.overview.messageFrequency.toFixed(1)}回/分

【エンゲージメント】
全体評価: ${analysis.playerEngagement.overall}
相互作用品質: ${analysis.playerEngagement.interactionQuality}

【ストーリー進行】
現在フェーズ: ${analysis.storyProgress.currentPhase}
進行ペース: ${analysis.storyProgress.progressRate}

【改善提案】
${analysis.suggestions.map(s => `・${s.description}\n  → ${s.actionable}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

function formatEventResult(event) {
  return `【ランダムイベント】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
タイトル: ${event.title}
描写: ${event.description}
難易度: ${event.difficulty}

【推奨アクション】
${event.suggestedActions.map(action => `・${action}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

function formatRuleHelpResult(help) {
  return `【ルール支援】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${help.description}

${help.examples ? `【例】\n${help.examples.map(ex => `・${ex}`).join('\n')}\n` : ''}
${help.tips ? `【Tips】\n${help.tips}\n` : ''}
${help.suggestion ? `【提案】\n${help.suggestion}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// エラーハンドリング
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// サーバー起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ココフォリア MCP サーバーが起動しました');
}

main().catch((error) => {
  console.error('サーバー起動エラー:', error);
  process.exit(1);
});
