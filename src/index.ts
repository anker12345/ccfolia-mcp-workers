/**
 * ココフォリア MCP Workers API
 * Cloudflare Workers上で動作するTRPG支援API
 */

interface Env {
  CACHE?: KVNamespace;
  ENVIRONMENT?: string;
}

interface MCPRequest {
  command: string;
  params: any[];
  sessionId?: string;
  timestamp?: number;
}

interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

// CORS設定
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// JSONレスポンス生成
function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// エラーレスポンス生成
function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ 
    success: false, 
    error: message, 
    timestamp: Date.now() 
  }, status);
}

// 成功レスポンス生成
function successResponse(data: any): Response {
  return jsonResponse({ 
    success: true, 
    data, 
    timestamp: Date.now() 
  });
}

// ヘルスチェック
async function handleHealth(): Promise<Response> {
  return successResponse({
    status: 'healthy',
    service: 'ccfolia-mcp-workers',
    version: '1.0.0',
    endpoints: [
      'GET /health',
      'POST /generate_character',
      'POST /generate_npc_batch', 
      'POST /analyze_session',
      'POST /generate_random_event',
      'POST /get_rule_help'
    ]
  });
}

// キャラクター生成
async function handleGenerateCharacter(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { name, age, profession, background } = body;

    if (!name) {
      return errorResponse('名前は必須です');
    }

    // キャラクター生成ロジック（実際にはAI APIを使用）
    const character = {
      name,
      age: age || Math.floor(Math.random() * 50) + 20,
      profession: profession || '冒険者',
      background: background || '謎に満ちた過去を持つ',
      stats: {
        HP: Math.floor(Math.random() * 100) + 50,
        MP: Math.floor(Math.random() * 50) + 25,
        STR: Math.floor(Math.random() * 18) + 3,
        DEX: Math.floor(Math.random() * 18) + 3,
        INT: Math.floor(Math.random() * 18) + 3,
        WIS: Math.floor(Math.random() * 18) + 3,
        CHA: Math.floor(Math.random() * 18) + 3,
      },
      skills: generateRandomSkills(),
      items: generateRandomItems(),
      personality: generatePersonality(),
    };

    return successResponse(character);
  } catch (error) {
    return errorResponse('キャラクター生成に失敗しました');
  }
}

// NPC一括生成
async function handleGenerateNPCBatch(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { scenario, count = 3, difficulty = 'normal' } = body;

    if (!scenario) {
      return errorResponse('シナリオは必須です');
    }

    const npcs = [];
    for (let i = 0; i < Math.min(count, 10); i++) {
      npcs.push(generateNPC(scenario, difficulty));
    }

    return successResponse({
      scenario,
      count: npcs.length,
      npcs
    });
  } catch (error) {
    return errorResponse('NPC生成に失敗しました');
  }
}

// セッション分析
async function handleAnalyzeSession(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { chatLogs, playerActions, sessionTime } = body;

    const analysis = {
      totalMessages: chatLogs?.length || 0,
      activeTime: sessionTime || 0,
      playerEngagement: analyzePlayerEngagement(playerActions),
      storyProgress: analyzeStoryProgress(chatLogs),
      suggestions: generateSessionSuggestions(chatLogs, playerActions),
    };

    return successResponse(analysis);
  } catch (error) {
    return errorResponse('セッション分析に失敗しました');
  }
}

// ランダムイベント生成
async function handleGenerateRandomEvent(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { category = 'general', difficulty = 'normal', setting } = body;

    const event = generateRandomEvent(category, difficulty, setting);
    
    return successResponse(event);
  } catch (error) {
    return errorResponse('イベント生成に失敗しました');
  }
}

// ルール支援
async function handleGetRuleHelp(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { query, system = 'general' } = body;

    const help = getRuleHelp(query, system);
    
    return successResponse(help);
  } catch (error) {
    return errorResponse('ルール支援に失敗しました');
  }
}

// ヘルパー関数群
function generateRandomSkills(): string[] {
  const skills = [
    '剣術', '魔法学', '治療', '隠密', '説得', '学問', '手先の器用さ', 
    '運動', '観察', '霊感', '料理', '音楽', '芸術', '商業'
  ];
  return skills.sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3));
}

function generateRandomItems(): string[] {
  const items = [
    '鉄の剣', '革の鎧', '治療薬', 'ロープ', '松明', '水袋', '食料',
    '魔法の杖', '盗賊道具', '楽器', '地図', '羊皮紙', 'インク',
    '貴重な宝石', '古い硬貨', '謎の鍵'
  ];
  return items.sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 4));
}

function generatePersonality(): string {
  const traits = [
    '勇敢で正義感が強い', '慎重で思慮深い', '好奇心旺盛で冒険好き',
    '優しく思いやりがある', '頭脳明晰で理論的', '陽気で社交的',
    '謎めいていて神秘的', '実用的で現実主義', '情熱的で行動力がある'
  ];
  return traits[Math.floor(Math.random() * traits.length)];
}

function generateNPC(scenario: string, difficulty: string): any {
  const names = ['太郎', '花子', '次郎', '美咲', '健太', '由美', '達也', '麻衣'];
  const roles = ['商人', '農民', '学者', '職人', '貴族', '兵士', '聖職者', '盗賊'];
  
  return {
    name: names[Math.floor(Math.random() * names.length)],
    role: roles[Math.floor(Math.random() * roles.length)],
    appearance: '平均的な体格で、温和な表情',
    personality: generatePersonality(),
    motivation: `${scenario}に関連した個人的な理由`,
    secretOrHook: '隠された秘密や物語のフックとなる要素',
    stats: {
      level: difficulty === 'easy' ? 1 : difficulty === 'hard' ? 5 : 3,
      hp: Math.floor(Math.random() * 50) + 20,
    }
  };
}

function analyzePlayerEngagement(actions: any[]): string {
  if (!actions || actions.length === 0) return '低';
  if (actions.length > 20) return '高';
  if (actions.length > 10) return '中';
  return '低';
}

function analyzeStoryProgress(chatLogs: any[]): string {
  if (!chatLogs || chatLogs.length === 0) return '開始前';
  if (chatLogs.length > 100) return '後半';
  if (chatLogs.length > 50) return '中盤';
  return '序盤';
}

function generateSessionSuggestions(chatLogs: any[], actions: any[]): string[] {
  return [
    'プレイヤー同士の相互作用を促す',
    '新しい手がかりや情報を提供する',
    '感情的な場面を挿入する',
    'アクションシーンを追加する'
  ];
}

function generateRandomEvent(category: string, difficulty: string, setting?: string): any {
  const events = {
    exploration: [
      '古い遺跡を発見した',
      '謎の光が森の奥で輝いている',
      '動物たちが異常な行動を見せている'
    ],
    social: [
      '街で祭りが開催されている', 
      '重要人物からの依頼が舞い込んだ',
      '噂話が真実だったことが判明した'
    ],
    combat: [
      '盗賊団が襲撃してきた',
      '魔物の群れに遭遇した',
      '決闘を申し込まれた'
    ]
  };

  const categoryEvents = events[category as keyof typeof events] || events.exploration;
  const event = categoryEvents[Math.floor(Math.random() * categoryEvents.length)];

  return {
    title: event,
    description: `${setting || '冒険の途中で'}、${event}。`,
    difficulty,
    suggestedActions: [
      '詳しく調査する',
      '慎重に観察する', 
      '積極的に関わる',
      '別の方法を探す'
    ]
  };
}

function getRuleHelp(query: string, system: string): any {
  const commonRules = {
    '判定': {
      description: '2d6+能力値+技能レベルで判定',
      examples: ['攻撃判定', '技能判定', '抵抗判定'],
      tips: '目標値は通常7-12の範囲'
    },
    '戦闘': {
      description: 'イニシアチブ順で行動',
      examples: ['攻撃', '魔法', '移動', '防御'],
      tips: 'HPが0になると気絶状態'
    },
    '魔法': {
      description: 'MPを消費して発動',
      examples: ['攻撃魔法', '回復魔法', '支援魔法'],
      tips: '詠唱時間と射程に注意'
    }
  };

  return commonRules[query] || {
    description: '該当するルールが見つかりません',
    suggestion: '具体的なルール名を指定してください'
  };
}

// メインハンドラー
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS プリフライト
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ルーティング
      switch (pathname) {
        case '/health':
          return await handleHealth();
          
        case '/generate_character':
          if (request.method !== 'POST') {
            return errorResponse('POST method required', 405);
          }
          return await handleGenerateCharacter(request);
          
        case '/generate_npc_batch':
          if (request.method !== 'POST') {
            return errorResponse('POST method required', 405);
          }
          return await handleGenerateNPCBatch(request);
          
        case '/analyze_session':
          if (request.method !== 'POST') {
            return errorResponse('POST method required', 405);
          }
          return await handleAnalyzeSession(request);
          
        case '/generate_random_event':
          if (request.method !== 'POST') {
            return errorResponse('POST method required', 405);
          }
          return await handleGenerateRandomEvent(request);
          
        case '/get_rule_help':
          if (request.method !== 'POST') {
            return errorResponse('POST method required', 405);
          }
          return await handleGetRuleHelp(request);
          
        case '/':
          return successResponse({
            message: 'ココフォリア MCP Workers API',
            version: '1.0.0',
            documentation: '/health で利用可能なエンドポイントを確認'
          });
          
        default:
          return errorResponse('Endpoint not found', 404);
      }
    } catch (error) {
      console.error('Unhandled error:', error);
      return errorResponse('Internal server error', 500);
    }
  },
};
