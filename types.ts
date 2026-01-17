export interface Message {
    id: string
    role: 'user' | 'model' | 'system'
    content: string
    timestamp: number
    image?: string // Base64 image
}

export interface RepoInfo {
    owner: string
    repo: string
    defaultBranch: string
    description?: string
}

export interface YoutubeInfo {
    videoId: string
    title: string
    channel: string
}

export interface FileNode {
    path: string
    mode: string
    type: 'blob' | 'tree'
    sha: string
    size?: number
    url: string
    handle?: any // FileSystemFileHandle for local files
}

export interface FileContent {
    path: string
    content: string
}

export interface RagChunk {
    id: string
    text: string
    source: string
    embedding?: number[]
}

export enum AppStatus {
    IDLE = 'IDLE',
    FETCHING_REPO = 'FETCHING_REPO',
    ANALYZING = 'ANALYZING',
    INDEXING = 'INDEXING',
    BUILDING_GRAPH = 'BUILDING_GRAPH',
    GENERATING_CHALLENGE = 'GENERATING_CHALLENGE',
    READY = 'READY',
    ERROR = 'ERROR',
}

export type AiModelId =
    | 'gemini-3-flash-preview'
    | 'gemini-3-pro-preview'
    | 'gemini-2.5-flash-preview-09-2025'
    | 'gemini-2.5-flash-lite-preview-02-05'

export interface AppSettings {
    githubToken: string
    modelId: AiModelId
    isReviewerMode: boolean
    enableThinking: boolean
}

export const AVAILABLE_MODELS: { id: AiModelId; name: string; description: string }[] = [
    {
        id: 'gemini-3-flash-preview',
        name: 'Gemini 3 Flash',
        description: 'الأسرع والأكثر كفاءة (مستحسن)',
    },
    {
        id: 'gemini-3-pro-preview',
        name: 'Gemini 3 Pro',
        description: 'قدرات استنتاجية أعلى (يدعم التفكير العميق)',
    },
    {
        id: 'gemini-2.5-flash-preview-09-2025',
        name: 'Gemini 2.5 Flash',
        description: 'الإصدار السابق المستقر',
    },
    {
        id: 'gemini-2.5-flash-lite-preview-02-05',
        name: 'Gemini 2.5 Flash Lite',
        description: 'استجابة فائقة السرعة (Low Latency)',
    },
]

// --- Semantic Compass Types ---

export type NodeType = 'FILE' | 'COMPONENT' | 'CONCEPT' | 'ISSUE' | 'DOC' | 'SLACK_THREAD' | 'VIDEO'
export type RelationType = 'IMPORTS' | 'CALLS' | 'DEFINES' | 'RELATED_TO' | 'BLOCKS' | 'DOCUMENTS' | 'MENTIONS'

export interface NodeMetadata {
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    author?: string
    lastUpdated?: string
    description?: string
    externalUrl?: string // Link to Jira/Confluence
    tags?: string[]
}

export interface GraphNode {
    id: string
    label: string
    type: NodeType
    metadata: NodeMetadata
    source: 'CODEBASE' | 'JIRA' | 'CONFLUENCE' | 'SLACK'

    // D3 Simulation properties
    x?: number
    y?: number
    fx?: number | null
    fy?: number | null
}

export interface GraphEdge {
    source: string | GraphNode // D3 transforms string IDs to Node objects
    target: string | GraphNode
    relation: RelationType
    weight?: number
}

export interface KnowledgeGraph {
    nodes: GraphNode[]
    edges: GraphEdge[]
    lastUpdated: number
}

// --- SkillForge Types (Active Learning) ---

export type ChallengeType = 'QUIZ' | 'CODE_FIX' | 'IMPLEMENTATION'
export type DifficultyLevel = 'Novice' | 'Intermediate' | 'Expert'

export interface ContextSource {
    id: string // File path or Video ID
    type: 'FILE' | 'YOUTUBE'
    timestampOrLine?: string | number
    snippet?: string
}

export interface Challenge {
    id: string
    type: ChallengeType
    difficulty: DifficultyLevel
    question: string
    description: string
    startingSnippet?: string // The code to fix or start with
    options?: string[] // For QUIZ
    correctOptionIndex?: number // For QUIZ internal check (optional, better to let AI judge)
    relatedTags: string[] // e.g. ['React', 'Hooks', 'Security']
    xpPoints: number
    source: ContextSource
}

export interface SubmissionResult {
    isCorrect: boolean
    feedback: string
    codeReview?: string // Suggestions for improvement
    xpEarned: number
    explanation: string
}

export interface SkillBadge {
    id: string
    name: string
    level: number
    progress: number // 0 to 100
    icon?: string
}

export interface UserProfile {
    totalXp: number
    level: number
    badges: SkillBadge[]
}
