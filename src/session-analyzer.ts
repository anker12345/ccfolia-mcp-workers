/**
 * セッション分析専用モジュール
 */

export interface SessionData {
  chatLogs: ChatMessage[];
  playerActions: PlayerAction[];
  sessionTime: number;
  players: Player[];
  scenarioInfo?: ScenarioInfo;
}

export interface ChatMessage {
  timestamp: number;
  playerName: string;
  message: string;
  type: 'ic' | 'ooc' | 'system' | 'dice';
  diceResult?: DiceResult;
}

export interface PlayerAction {
  timestamp: number;
  playerName: string;
  actionType: 'move' | 'attack' | 'skill' | 'magic' | 'interaction' | 'investigation';
  target?: string;
  result?: string;
  success?: boolean;
}

export interface Player {
  name: string;
  characterName: string;
  isGM: boolean;
  joinTime: number;
  lastActivity: number;
}

export interface DiceResult {
  formula: string;
  result: number;
  details: string;
}

export interface ScenarioInfo {
  title: string;
  genre: string;
  expectedDuration: number;
  currentPhase: string;
}

export interface SessionAnalysis {
  overview: SessionOverview;
  playerEngagement: PlayerEngagementAnalysis;
  storyProgress: StoryProgressAnalysis;
  gameplayMetrics: GameplayMetrics;
  suggestions: SessionSuggestion[];
  warnings: SessionWarning[];
}

export interface SessionOverview {
  totalDuration: number;
  totalMessages: number;
  totalActions: number;
  activePlayers: number;
  averageMessageLength: number;
  messageFrequency: number;
}

export interface PlayerEngagementAnalysis {
  overall: 'low' | 'medium' | 'high';
  individual: { [playerName: string]: PlayerMetrics };
  quietPlayers: string[];
  dominatingPlayers: string[];
  interactionQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface PlayerMetrics {
  messageCount: number;
  actionCount: number;
  averageMessageLength: number;
  participationRate: number;
  roleplayQuality: 'low' | 'medium' | 'high';
  lastActivity: number;
}

export interface StoryProgressAnalysis {
  currentPhase: 'setup' | 'investigation' | 'development' | 'climax' | 'resolution';
  progressRate: 'slow' | 'normal' | 'fast';
  keyEvents: string[];
  plotHooks: string[];
  unresolved: string[];
}

export interface GameplayMetrics {
  diceRolls: number;
  successRate: number;
  combatEncounters: number;
  investigationActions: number;
  socialInteractions: number;
  magicUsage: number;
}

export interface SessionSuggestion {
  type: 'gameplay' | 'story' | 'player_engagement' | 'pacing';
  priority: 'low' | 'medium' | 'high';
  description: string;
  actionable: string;
}

export interface SessionWarning {
  type: 'player_disengagement' | 'story_stagnation' | 'time_management' | 'technical';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  recommendation: string;
}

// キーワード分析用辞書
const STORY_KEYWORDS = {
  setup: ['導入', '説明', '設定', '背景', '開始', '始まり', '出会い'],
  investigation: ['調べる', '探る', '捜査', '手がかり', '証拠', '情報', '聞き込み'],
  development: ['展開', '事件', '発見', '真実', '秘密', '謎', '驚き'],
  climax: ['戦闘', '対決', '決戦', '最終', 'ボス', '危機', '頂点'],
  resolution: ['解決', '終了', '結末', '決着', '完了', '成功', '失敗']
};

const EMOTION_KEYWORDS = {
  positive: ['楽しい', '嬉しい', '面白い', '素晴らしい', '良い', '成功'],
  negative: ['困った', '大変', '危険', '失敗', '悪い', '問題'],
  excitement: ['わくわく', 'ドキドキ', '興奮', '緊張', 'スリル'],
  confusion: ['分からない', '謎', '不明', '困惑', '混乱']
};

const ACTION_KEYWORDS = {
  combat: ['攻撃', '戦闘', '戦い', 'ダメージ', 'HP', '倒す'],
  magic: ['魔法', '呪文', 'スペル', 'MP', '詠唱', '魔力'],
  investigation: ['調査', '観察', '探索', '捜索', '発見', '確認'],
  social: ['会話', '交渉', '説得', '話す', '聞く', '相談'],
  movement: ['移動', '行く', '来る', '進む', '戻る', '逃げる']
};

// メッセージ分析
function analyzeMessage(message: ChatMessage): {
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  actionType?: string;
  storyPhase?: string;
} {
  const text = message.message.toLowerCase();
  const keywords: string[] = [];
  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  let actionType: string | undefined;
  let storyPhase: string | undefined;

  // キーワード検出
  Object.entries(STORY_KEYWORDS).forEach(([phase, words]) => {
    if (words.some(word => text.includes(word))) {
      keywords.push(phase);
      storyPhase = phase;
    }
  });

  Object.entries(ACTION_KEYWORDS).forEach(([action, words]) => {
    if (words.some(word => text.includes(word))) {
      keywords.push(action);
      actionType = action;
    }
  });

  // 感情分析
  const positiveCount = EMOTION_KEYWORDS.positive.filter(word => text.includes(word)).length;
  const negativeCount = EMOTION_KEYWORDS.negative.filter(word => text.includes(word)).length;

  if (positiveCount > negativeCount) {
    sentiment = 'positive';
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative';
  }

  return { keywords, sentiment, actionType, storyPhase };
}

// プレイヤーエンゲージメント分析
function analyzePlayerEngagement(sessionData: SessionData): PlayerEngagementAnalysis {
  const { chatLogs, playerActions, players } = sessionData;
  const individual: { [playerName: string]: PlayerMetrics } = {};
  
  // 各プレイヤーのメトリクス計算
  players.forEach(player => {
    if (player.isGM) return; // GMは除外

    const playerMessages = chatLogs.filter(msg => msg.playerName === player.characterName);
    const playerActionsFiltered = playerActions.filter(action => action.playerName === player.characterName);
    
    const messageCount = playerMessages.length;
    const actionCount = playerActionsFiltered.length;
    const averageMessageLength = messageCount > 0 
      ? playerMessages.reduce((sum, msg) => sum + msg.message.length, 0) / messageCount 
      : 0;
    
    const totalPossibleParticipation = chatLogs.length;
    const participationRate = totalPossibleParticipation > 0 ? messageCount / totalPossibleParticipation : 0;
    
    // ロールプレイ品質評価（メッセージの長さと内容で判定）
    let roleplayQuality: 'low' | 'medium' | 'high' = 'low';
    if (averageMessageLength > 50 && messageCount > 5) {
      roleplayQuality = 'high';
    } else if (averageMessageLength > 20 && messageCount > 2) {
      roleplayQuality = 'medium';
    }

    individual[player.characterName] = {
      messageCount,
      actionCount,
      averageMessageLength,
      participationRate,
      roleplayQuality,
      lastActivity: player.lastActivity
    };
  });

  // 全体的なエンゲージメント評価
  const participationRates = Object.values(individual).map(metrics => metrics.participationRate);
  const averageParticipation = participationRates.reduce((sum, rate) => sum + rate, 0) / participationRates.length;
  
  let overall: 'low' | 'medium' | 'high' = 'medium';
  if (averageParticipation > 0.15) {
    overall = 'high';
  } else if (averageParticipation < 0.05) {
    overall = 'low';
  }

  // 問題のあるプレイヤー検出
  const quietPlayers = Object.entries(individual)
    .filter(([_, metrics]) => metrics.participationRate < 0.03)
    .map(([name, _]) => name);

  const dominatingPlayers = Object.entries(individual)
    .filter(([_, metrics]) => metrics.participationRate > 0.3)
    .map(([name, _]) => name);

  // 相互作用品質評価
  const interactionMessages = chatLogs.filter(msg => 
    msg.message.includes('君') || msg.message.includes('あなた') || 
    players.some(p => p.characterName !== msg.playerName && msg.message.includes(p.characterName))
  );
  
  let interactionQuality: 'poor' | 'fair' | 'good' | 'excellent' = 'fair';
  const interactionRate = chatLogs.length > 0 ? interactionMessages.length / chatLogs.length : 0;
  
  if (interactionRate > 0.3) {
    interactionQuality = 'excellent';
  } else if (interactionRate > 0.2) {
    interactionQuality = 'good';
  } else if (interactionRate < 0.1) {
    interactionQuality = 'poor';
  }

  return {
    overall,
    individual,
    quietPlayers,
    dominatingPlayers,
    interactionQuality
  };
}

// ストーリー進行分析
function analyzeStoryProgress(sessionData: SessionData): StoryProgressAnalysis {
  const { chatLogs, sessionTime } = sessionData;
  
  // フェーズ検出
  const phaseVotes: { [phase: string]: number } = {};
  const keyEvents: string[] = [];
  const plotHooks: string[] = [];
  
  chatLogs.forEach(msg => {
    const analysis = analyzeMessage(msg);
    
    if (analysis.storyPhase) {
      phaseVotes[analysis.storyPhase] = (phaseVotes[analysis.storyPhase] || 0) + 1;
    }

    // 重要イベント検出
    if (msg.message.length > 100 && (analysis.sentiment !== 'neutral' || analysis.actionType)) {
      keyEvents.push(`${msg.playerName}: ${msg.message.substring(0, 50)}...`);
    }

    // プロットフック検出
    if (msg.message.includes('謎') || msg.message.includes('手がかり') || msg.message.includes('秘密')) {
      plotHooks.push(msg.message.substring(0, 30) + '...');
    }
  });

  // 最も多いフェーズを現在フェーズとする
  const currentPhase = Object.entries(phaseVotes)
    .sort(([,a], [,b]) => b - a)[0]?.[0] as StoryProgressAnalysis['currentPhase'] || 'setup';

  // 進行率評価
  const expectedMessagesPer30Min = 30; // 30分あたりの期待メッセージ数
  const expectedMessages = (sessionTime / (30 * 60 * 1000)) * expectedMessagesPer30Min;
  const actualMessages = chatLogs.length;
  
  let progressRate: 'slow' | 'normal' | 'fast' = 'normal';
  if (actualMessages > expectedMessages * 1.5) {
    progressRate = 'fast';
  } else if (actualMessages < expectedMessages * 0.5) {
    progressRate = 'slow';
  }

  // 未解決要素（プロットフックから推測）
  const unresolved = plotHooks.slice(0, 3); // 最新の3つ

  return {
    currentPhase,
    progressRate,
    keyEvents: keyEvents.slice(-5), // 最新の5つ
    plotHooks: plotHooks.slice(-3), // 最新の3つ
    unresolved
  };
}

// ゲームプレイメトリクス分析
function analyzeGameplayMetrics(sessionData: SessionData): GameplayMetrics {
  const { chatLogs, playerActions } = sessionData;
  
  let diceRolls = 0;
  let successfulRolls = 0;
  let combatEncounters = 0;
  let investigationActions = 0;
  let socialInteractions = 0;
  let magicUsage = 0;

  // チャットログから分析
  chatLogs.forEach(msg => {
    if (msg.type === 'dice' && msg.diceResult) {
      diceRolls++;
      if (msg.diceResult.result >= 7) { // 仮の成功基準
        successfulRolls++;
      }
    }

    const analysis = analyzeMessage(msg);
    switch (analysis.actionType) {
      case 'combat':
        combatEncounters++;
        break;
      case 'investigation':
        investigationActions++;
        break;
      case 'social':
        socialInteractions++;
        break;
      case 'magic':
        magicUsage++;
        break;
    }
  });

  // プレイヤーアクションから追加分析
  playerActions.forEach(action => {
    switch (action.actionType) {
      case 'attack':
        combatEncounters++;
        break;
      case 'investigation':
        investigationActions++;
        break;
      case 'interaction':
        socialInteractions++;
        break;
      case 'magic':
        magicUsage++;
        break;
    }
  });

  const successRate = diceRolls > 0 ? successfulRolls / diceRolls : 0;

  return {
    diceRolls,
    successRate,
    combatEncounters,
    investigationActions,
    socialInteractions,
    magicUsage
  };
}

// 提案生成
function generateSuggestions(
  engagement: PlayerEngagementAnalysis,
  progress: StoryProgressAnalysis,
  metrics: GameplayMetrics,
  sessionTime: number
): SessionSuggestion[] {
  const suggestions: SessionSuggestion[] = [];

  // プレイヤーエンゲージメント関連
  if (engagement.overall === 'low') {
    suggestions.push({
      type: 'player_engagement',
      priority: 'high',
      description: 'プレイヤーの参加度が低下しています',
      actionable: 'プレイヤーに直接質問を投げかけたり、個別のシーンを作ってみてください'
    });
  }

  if (engagement.quietPlayers.length > 0) {
    suggestions.push({
      type: 'player_engagement',
      priority: 'medium',
      description: `${engagement.quietPlayers.join(', ')}の参加が少なくなっています`,
      actionable: 'これらのプレイヤーに焦点を当てたシーンや選択肢を提供してください'
    });
  }

  if (engagement.interactionQuality === 'poor') {
    suggestions.push({
      type: 'player_engagement',
      priority: 'medium',
      description: 'プレイヤー間の相互作用が少ないです',
      actionable: 'グループで解決すべき問題や、意見が分かれる状況を提示してみてください'
    });
  }

  // ストーリー進行関連
  if (progress.progressRate === 'slow') {
    suggestions.push({
      type: 'pacing',
      priority: 'medium',
      description: 'ストーリーの進行が遅くなっています',
      actionable: '新しい手がかりやイベントを導入して展開を加速させてください'
    });
  }

  if (progress.currentPhase === 'setup' && sessionTime > 60 * 60 * 1000) { // 1時間以上
    suggestions.push({
      type: 'story',
      priority: 'high',
      description: '導入が長引いています',
      actionable: 'メインイベントや調査要素を早めに導入することを検討してください'
    });
  }

  // ゲームプレイ関連
  if (metrics.diceRolls < 5 && sessionTime > 30 * 60 * 1000) { // 30分以上でダイス5回未満
    suggestions.push({
      type: 'gameplay',
      priority: 'low',
      description: 'ダイスロールが少なく、ゲーム要素が不足しています',
      actionable: '技能判定や能力チェックの機会を増やしてみてください'
    });
  }

  if (metrics.successRate < 0.3 && metrics.diceRolls > 5) {
    suggestions.push({
      type: 'gameplay',
      priority: 'medium',
      description: '判定の成功率が低く、プレイヤーが挫折感を感じている可能性があります',
      actionable: '目標値を調整するか、別のアプローチを提案してください'
    });
  }

  return suggestions;
}

// 警告生成
function generateWarnings(
  engagement: PlayerEngagementAnalysis,
  progress: StoryProgressAnalysis,
  sessionTime: number
): SessionWarning[] {
  const warnings: SessionWarning[] = [];

  // 深刻なプレイヤー問題
  if (engagement.dominatingPlayers.length > 0) {
    warnings.push({
      type: 'player_disengagement',
      severity: 'moderate',
      description: `${engagement.dominatingPlayers.join(', ')}がセッションを支配している可能性があります`,
      recommendation: '他のプレイヤーにも発言機会を意識的に提供してください'
    });
  }

  // 時間管理
  if (sessionTime > 4 * 60 * 60 * 1000) { // 4時間以上
    warnings.push({
      type: 'time_management',
      severity: 'minor',
      description: 'セッション時間が長くなっています',
      recommendation: '適切な区切りで休憩や終了を検討してください'
    });
  }

  // ストーリー停滞
  if (progress.keyEvents.length < 2 && sessionTime > 90 * 60 * 1000) { // 90分でイベント2つ未満
    warnings.push({
      type: 'story_stagnation',
      severity: 'moderate',
      description: 'ストーリーの進展が見られません',
      recommendation: '新しい展開やNPCの登場を検討してください'
    });
  }

  return warnings;
}

// メインの分析関数
export function analyzeSession(sessionData: SessionData): SessionAnalysis {
  // 基本統計
  const overview: SessionOverview = {
    totalDuration: sessionData.sessionTime,
    totalMessages: sessionData.chatLogs.length,
    totalActions: sessionData.playerActions.length,
    activePlayers: sessionData.players.filter(p => !p.isGM).length,
    averageMessageLength: sessionData.chatLogs.length > 0 
      ? sessionData.chatLogs.reduce((sum, msg) => sum + msg.message.length, 0) / sessionData.chatLogs.length 
      : 0,
    messageFrequency: sessionData.sessionTime > 0 
      ? sessionData.chatLogs.length / (sessionData.sessionTime / (60 * 1000)) // messages per minute
      : 0
  };

  // 詳細分析
  const playerEngagement = analyzePlayerEngagement(sessionData);
  const storyProgress = analyzeStoryProgress(sessionData);
  const gameplayMetrics = analyzeGameplayMetrics(sessionData);

  // 提案と警告
  const suggestions = generateSuggestions(playerEngagement, storyProgress, gameplayMetrics, sessionData.sessionTime);
  const warnings = generateWarnings(playerEngagement, storyProgress, sessionData.sessionTime);

  return {
    overview,
    playerEngagement,
    storyProgress,
    gameplayMetrics,
    suggestions,
    warnings
  };
}

// 分析結果のフォーマット
export function formatAnalysisReport(analysis: SessionAnalysis): string {
  const { overview, playerEngagement, storyProgress, gameplayMetrics, suggestions, warnings } = analysis;
  
  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}時間${minutes}分`;
  };

  let report = `
【セッション分析レポート】
═══════════════════════════════════════════════════════════════════════

【基本統計】
セッション時間: ${formatDuration(overview.totalDuration)}
総メッセージ数: ${overview.totalMessages}
総アクション数: ${overview.totalActions}
参加プレイヤー数: ${overview.activePlayers}
平均メッセージ長: ${Math.round(overview.averageMessageLength)}文字
メッセージ頻度: ${overview.messageFrequency.toFixed(1)}回/分

【プレイヤーエンゲージメント】
全体評価: ${playerEngagement.overall}
相互作用品質: ${playerEngagement.interactionQuality}`;

  if (playerEngagement.quietPlayers.length > 0) {
    report += `\n静かなプレイヤー: ${playerEngagement.quietPlayers.join(', ')}`;
  }

  if (playerEngagement.dominatingPlayers.length > 0) {
    report += `\n発言の多いプレイヤー: ${playerEngagement.dominatingPlayers.join(', ')}`;
  }

  report += `

【ストーリー進行】
現在フェーズ: ${storyProgress.currentPhase}
進行ペース: ${storyProgress.progressRate}
キーイベント数: ${storyProgress.keyEvents.length}
未解決要素: ${storyProgress.unresolved.length}

【ゲームプレイメトリクス】
ダイスロール回数: ${gameplayMetrics.diceRolls}
判定成功率: ${(gameplayMetrics.successRate * 100).toFixed(1)}%
戦闘回数: ${gameplayMetrics.combatEncounters}
調査アクション: ${gameplayMetrics.investigationActions}
社会的相互作用: ${gameplayMetrics.socialInteractions}
魔法使用: ${gameplayMetrics.magicUsage}`;

  if (warnings.length > 0) {
    report += `\n\n【⚠️ 警告】`;
    warnings.forEach(warning => {
      report += `\n${warning.description}`;
      report += `\n→ ${warning.recommendation}`;
    });
  }

  if (suggestions.length > 0) {
    report += `\n\n【💡 改善提案】`;
    suggestions.forEach(suggestion => {
      report += `\n[${suggestion.priority.toUpperCase()}] ${suggestion.description}`;
      report += `\n→ ${suggestion.actionable}`;
    });
  }

  report += `\n═══════════════════════════════════════════════════════════════════════`;

  return report;
}

// サンプルデータ生成（テスト用）
export function generateSampleSessionData(): SessionData {
  const players: Player[] = [
    { name: 'GM', characterName: 'GM', isGM: true, joinTime: Date.now() - 3600000, lastActivity: Date.now() },
    { name: 'Player1', characterName: '田中太郎', isGM: false, joinTime: Date.now() - 3600000, lastActivity: Date.now() - 300000 },
    { name: 'Player2', characterName: '佐藤花子', isGM: false, joinTime: Date.now() - 3600000, lastActivity: Date.now() - 600000 },
    { name: 'Player3', characterName: '山田次郎', isGM: false, joinTime: Date.now() - 3600000, lastActivity: Date.now() - 120000 }
  ];

  const chatLogs: ChatMessage[] = [
    { timestamp: Date.now() - 3000000, playerName: 'GM', message: 'セッションを開始します', type: 'system' },
    { timestamp: Date.now() - 2800000, playerName: '田中太郎', message: '調査を開始したいと思います', type: 'ic' },
    { timestamp: Date.now() - 2600000, playerName: 'GM', message: '調査判定をお願いします', type: 'system' },
    { timestamp: Date.now() - 2400000, playerName: '田中太郎', message: '2d6+3', type: 'dice', diceResult: { formula: '2d6+3', result: 9, details: '[3,4]+3=9' } }
  ];

  const playerActions: PlayerAction[] = [
    { timestamp: Date.now() - 2700000, playerName: '田中太郎', actionType: 'investigation', target: '現場', result: '手がかりを発見', success: true }
  ];

  return {
    chatLogs,
    playerActions,
    sessionTime: 3600000, // 1時間
    players,
    scenarioInfo: {
      title: 'テストシナリオ',
      genre: 'ミステリー',
      expectedDuration: 4 * 60 * 60 * 1000, // 4時間
      currentPhase: 'investigation'
    }
  };
}
