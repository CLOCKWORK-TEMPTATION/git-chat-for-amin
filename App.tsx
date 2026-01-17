import React, { useState, useEffect, useRef } from 'react'
import {
    Message,
    AppStatus,
    RepoInfo,
    FileNode,
    AppSettings,
    YoutubeInfo,
    FileContent,
    KnowledgeGraph,
    Challenge,
    UserProfile,
    SubmissionResult,
    AiModelId,
} from './types'
import {
    parseGithubUrl,
    fetchRepoDetails,
    fetchRepoTree,
    fetchRepoFiles,
    fetchFileContent,
} from './services/githubService'
import { fetchUrlContent } from './services/webService'
import { extractVideoId, fetchYoutubeTranscript } from './services/youtubeService'
import { selectLocalDirectory, processLocalFilesForRag, readLocalFileContent } from './services/localFileService'
import { resolvePackageToRepo } from './services/packageService'
import { initializeGemini, startChatSession, sendMessageToGemini } from './services/geminiService'
import { initSemanticService, buildKnowledgeGraph } from './services/semanticService'
import { initSkillForgeService, generateContextualChallenge, evaluateSubmission } from './services/skillForgeService'
import { ragService } from './services/ragService'
import ChatBubble from './components/ChatBubble'
import Loader from './components/Loader'
import FileSidebar from './components/FileSidebar'
import SettingsModal from './components/SettingsModal'
import MermaidDiagram from './components/MermaidDiagram'
import YouTubePlayer, { YouTubePlayerHandle } from './components/YouTubePlayer'
import GraphView from './components/SemanticCompass/GraphView'
import ChallengeOverlay from './components/SkillForge/ChallengeOverlay'
import SkillTreeWidget from './components/SkillForge/SkillTreeWidget'

// Icons
const GithubIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
)

const GlobeIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
    </svg>
)

const YoutubeIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
)

const FolderIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
    </svg>
)

const PackageIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
    </svg>
)

const StackOverflowIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.986 21.865v-6.404h2.134V24H1.844v-8.539h2.13v6.404h15.012zM6.111 19.79h12.668v-2.125H6.111v2.125zm.94-5.43l12.151 2.591.473-2.06L7.522 12.3l-.472 2.06zm1.733-5.085l10.95 6.435 1.066-1.839-10.95-6.435-1.066 1.839zm3.118-4.711l8.635 9.323 1.55-1.464-8.635-9.322-1.55 1.463zM14.507.085l-1.91 1.413 5.968 12.307 1.91-1.413L14.507.085z" />
    </svg>
)

const CompassIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
        />
    </svg>
)

const SendIcon = () => (
    <svg className="w-5 h-5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
)

const MenuIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
)

const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
    </svg>
)

const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
)

const SettingsIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
)

const DiagramIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
        />
    </svg>
)

const ExportIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
    </svg>
)

const ImageIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
    </svg>
)

type InputMode = 'github' | 'url' | 'youtube' | 'local' | 'package' | 'stackoverflow'
type ViewMode = 'chat' | 'compass'

const App: React.FC = () => {
    const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE)
    const [inputMode, setInputMode] = useState<InputMode>('github')
    const [viewMode, setViewMode] = useState<ViewMode>('chat')

    // Settings with Persistence and Safe Default Merging
    const [settings, setSettings] = useState<AppSettings>(() => {
        const defaultModelId: AiModelId = 'gemini-3-flash-preview'
        const defaultSettings: AppSettings = {
            githubToken: '',
            modelId: defaultModelId,
            modelIds: {
                github: defaultModelId,
                web: defaultModelId,
                youtube: defaultModelId,
                local: defaultModelId,
            },
            isReviewerMode: false,
            enableThinking: false,
        }

        const saved = localStorage.getItem('gitChatSettings')
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as Partial<AppSettings>
                const fallbackModelId = parsed.modelId || defaultModelId
                const mergedModelIds = {
                    ...defaultSettings.modelIds,
                    ...(parsed.modelIds || {}),
                }
                ;(['github', 'web', 'youtube', 'local'] as const).forEach((key) => {
                    if (!mergedModelIds[key]) {
                        mergedModelIds[key] = fallbackModelId
                    }
                })
                return {
                    ...defaultSettings,
                    ...parsed,
                    modelId: parsed.modelId || defaultModelId,
                    modelIds: mergedModelIds,
                }
            } catch (e) {
                console.error('Failed to load settings, falling back to defaults', e)
            }
        }
        return defaultSettings
    })

    // Save settings whenever they change
    useEffect(() => {
        localStorage.setItem('gitChatSettings', JSON.stringify(settings))
    }, [settings])

    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isDiagramOpen, setIsDiagramOpen] = useState(false)

    const [urlInput, setUrlInput] = useState('')

    // Repo specific
    const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null)
    const [fileTree, setFileTree] = useState<FileNode[]>([])
    const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraph | null>(null)
    const [currentFileContent, setCurrentFileContent] = useState<string>('')

    // Doc specific
    const [docTitle, setDocTitle] = useState('')

    // YouTube specific
    const [youtubeInfo, setYoutubeInfo] = useState<YoutubeInfo | null>(null)
    const [youtubeTranscript, setYoutubeTranscript] = useState<string>('')

    // SkillForge (Active Learning)
    const [userProfile, setUserProfile] = useState<UserProfile>({ totalXp: 0, level: 1, badges: [] })
    const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null)
    const [isIgniteLoading, setIsIgniteLoading] = useState(false)

    const [statusMessage, setStatusMessage] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [inputText, setInputText] = useState('')

    // Image Upload State
    const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    // Search in chat
    const [isChatSearchOpen, setIsChatSearchOpen] = useState(false)
    const [chatSearchQuery, setChatSearchQuery] = useState('')

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatScrollRef = useRef<HTMLDivElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const playerRef = useRef<YouTubePlayerHandle>(null)
    const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true)

    useEffect(() => {
        // Auto-scroll to bottom of chat if not searching and user is near bottom
        if (!chatSearchQuery && viewMode === 'chat' && isAutoScrollEnabled) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, chatSearchQuery, viewMode, isAutoScrollEnabled])

    const handleChatScroll = () => {
        const container = chatScrollRef.current
        if (!container) return
        const threshold = 80
        const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold
        setIsAutoScrollEnabled(isNearBottom)
    }

    useEffect(() => {
        // Load User Profile from local storage
        const savedProfile = localStorage.getItem('skillForgeProfile')
        if (savedProfile) {
            setUserProfile(JSON.parse(savedProfile))
        }

        // Initialize Gemini with the ENV key on mount
        const key = process.env.API_KEY
        if (key) {
            initializeGemini(key)
            initSemanticService(key)
            initSkillForgeService(key)
        } else {
            setStatus(AppStatus.ERROR)
            setStatusMessage('خطأ: مفتاح API غير موجود. يرجى التأكد من إعداد المتغيرات البيئية.')
        }
    }, [])

    useEffect(() => {
        localStorage.setItem('skillForgeProfile', JSON.stringify(userProfile))
    }, [userProfile])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setUrlInput(val)

        const trimmed = val.trim().toLowerCase()

        if (trimmed.includes('github.com') && inputMode !== 'github') {
            setInputMode('github')
        } else if ((trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) && inputMode !== 'youtube') {
            setInputMode('youtube')
        } else if (
            (trimmed.includes('stackoverflow.com') || trimmed.includes('stackexchange.com')) &&
            inputMode !== 'stackoverflow'
        ) {
            setInputMode('stackoverflow')
        } else if (
            trimmed.startsWith('http') &&
            !trimmed.includes('github.com') &&
            !trimmed.includes('youtube.com') &&
            !trimmed.includes('stackoverflow.com') &&
            inputMode !== 'url'
        ) {
            setInputMode('url')
        }
    }

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
        setStatus(AppStatus.IDLE)
        setStatusMessage('')
    }

    const handleExportChat = () => {
        const chatContent = messages
            .map((m) => `**${m.role === 'user' ? 'User' : 'AI'}**: ${m.content}\n`)
            .join('\n---\n\n')
        const blob = new Blob([chatContent], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `chat-history-${Date.now()}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const resolveModelIdForInput = (mode: InputMode): AiModelId => {
        if (mode === 'github' || mode === 'package') return settings.modelIds.github
        if (mode === 'url' || mode === 'stackoverflow') return settings.modelIds.web
        if (mode === 'youtube') return settings.modelIds.youtube
        if (mode === 'local') return settings.modelIds.local
        return settings.modelId
    }

    const handleIgniteChallenge = async () => {
        if (status !== AppStatus.READY) return
        setIsIgniteLoading(true)

        try {
            let context = ''
            let source: any = { type: 'FILE', id: 'unknown' }

            if (youtubeInfo && youtubeTranscript) {
                // Video Context
                const currentTime = (await playerRef.current?.getCurrentTime()) || 0
                const minutes = Math.floor(currentTime / 60)
                const seconds = Math.floor(currentTime % 60)
                const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

                // Find transcript segment around current time (simple regex approximation for demo)
                const timestampRegex = /\[(\d{2}:\d{2})\]/g
                let match
                let bestMatchIndex = 0
                while ((match = timestampRegex.exec(youtubeTranscript)) !== null) {
                    if (match[1] <= timeString) bestMatchIndex = match.index
                    else break
                }

                const startIdx = Math.max(0, bestMatchIndex - 500)
                const endIdx = Math.min(youtubeTranscript.length, bestMatchIndex + 1500)
                context = youtubeTranscript.slice(startIdx, endIdx)
                source = { type: 'YOUTUBE', id: youtubeInfo.videoId, timestampOrLine: timeString }
            } else if (currentFileContent) {
                // File Context
                context = currentFileContent
                // Ideally pass file path
                const filePath =
                    messages.find((m) => m.content.includes('محتوى الملف'))?.content.split('\n')[0] || 'Active File'
                source = { type: 'FILE', id: filePath, timestampOrLine: 1 }
            } else {
                // Fallback: Use chat history
                context = messages
                    .slice(-3)
                    .map((m) => m.content)
                    .join('\n')
                source = { type: 'FILE', id: 'Chat History' }
            }

            const challenge = await generateContextualChallenge(context, source, resolveModelIdForInput(inputMode))
            setActiveChallenge(challenge)
        } catch (error) {
            console.error('Ignite failed', error)
            alert('فشل توليد التحدي. تأكد من وجود محتوى نشط (ملف مفتوح أو فيديو).')
        } finally {
            setIsIgniteLoading(false)
        }
    }

    const handleChallengeSubmit = async (submission: string): Promise<SubmissionResult> => {
        if (!activeChallenge) throw new Error('No active challenge')

        const result = await evaluateSubmission(activeChallenge, submission, resolveModelIdForInput(inputMode))

        if (result.isCorrect) {
            // Update Profile
            setUserProfile((prev) => {
                const newXp = prev.totalXp + result.xpEarned
                const newLevel = Math.floor(newXp / 500) + 1

                // Update Badges
                const newBadges = [...prev.badges]
                activeChallenge.relatedTags.forEach((tag) => {
                    const existing = newBadges.find((b) => b.name === tag)
                    if (existing) {
                        existing.progress = Math.min(existing.progress + 20, 100)
                        if (existing.progress === 100) existing.level += 1
                    } else {
                        newBadges.push({ id: tag, name: tag, level: 1, progress: 20 })
                    }
                })

                return { ...prev, totalXp: newXp, level: newLevel, badges: newBadges }
            })
        }

        return result
    }

    const handleSmartChapters = async () => {
        if (!youtubeInfo) return

        const prompt =
            'Please divide this video into logical chapters with start timestamps and a brief summary for each chapter. Format timestamps as [MM:SS].'

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: 'قم بتقسيم الفيديو إلى فصول (Chapters) مع طوابع زمنية وملخص لكل فصل.',
            timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, userMsg])

        try {
        const responseText = await sendMessageToGemini(prompt, '')
            const modelMsg: Message = {
                id: Date.now().toString(),
                role: 'model',
                content: responseText,
                timestamp: Date.now(),
            }
            setMessages((prev) => [...prev, modelMsg])
        } catch (error: any) {
            console.error(error)
        }
    }

    const handleStartAnalysis = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!urlInput.trim() && inputMode !== 'local') return

        // Reset previous session
        setMessages([])
        setFileTree([])
        setKnowledgeGraph(null)
        setRepoInfo(null)
        setDocTitle('')
        setYoutubeInfo(null)
        setCurrentFileContent('')
        ragService.clear() // Clear old RAG index
        setViewMode('chat')

        // Create new AbortController
        if (abortControllerRef.current) abortControllerRef.current.abort()
        const controller = new AbortController()
        abortControllerRef.current = controller

        try {
            if (inputMode === 'github') {
                await processGithubRepo(urlInput, controller.signal)
            } else if (inputMode === 'url' || inputMode === 'stackoverflow') {
                await processDocUrl(urlInput, controller.signal)
            } else if (inputMode === 'youtube') {
                await processYoutubeVideo(urlInput, controller.signal)
            } else if (inputMode === 'local') {
                await processLocalDirectory(controller.signal)
            } else if (inputMode === 'package') {
                await processPackage(urlInput, controller.signal)
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                setStatus(AppStatus.IDLE)
                return
            }
            console.error(error)
            setStatus(AppStatus.ERROR)
            setStatusMessage(error.message || 'حدث خطأ غير متوقع.')
        } finally {
            abortControllerRef.current = null
        }
    }

    const buildGraphAfterIndexing = async (files: FileContent[], repoName: string) => {
        setStatus(AppStatus.BUILDING_GRAPH)
        setStatusMessage('بناء البوصلة الدلالية (Knowledge Graph)...')

        // Non-blocking graph build
        buildKnowledgeGraph(files, repoName, resolveModelIdForInput(inputMode)).then((graph) => {
            setKnowledgeGraph(graph)
        })
    }

    const processGithubRepo = async (url: string, signal: AbortSignal) => {
        const parsed = parseGithubUrl(url)
        if (!parsed) {
            throw new Error('رابط غير صحيح. يرجى استخدام الصيغة: https://github.com/owner/repo')
        }

        setStatus(AppStatus.FETCHING_REPO)
        setStatusMessage('جاري الاتصال بـ GitHub...')

        const details = await fetchRepoDetails(parsed.owner, parsed.repo, settings.githubToken, signal)
        if (signal.aborted) return
        setRepoInfo(details)

        const tree = await fetchRepoTree(parsed.owner, parsed.repo, details.defaultBranch, settings.githubToken, signal)
        setFileTree(tree)

        setStatus(AppStatus.ANALYZING)
        const files = await fetchRepoFiles(details, tree, settings.githubToken, (msg) => setStatusMessage(msg), signal)
        if (signal.aborted) return

        setStatus(AppStatus.INDEXING)
        await ragService.addDocuments(files, (msg) => setStatusMessage(msg))

        // Trigger Semantic Compass Build
        buildGraphAfterIndexing(files, parsed.repo)

        setStatusMessage('جاري تهيئة المحلل الذكي...')
        const structureContext = `Repo: ${details.owner}/${details.repo}\nDescription: ${details.description}\nFile Structure (top 200):\n${tree
            .slice(0, 200)
            .map((n) => n.path)
            .join('\n')}`

        await startChatSession(
            resolveModelIdForInput('github'),
            structureContext,
            settings.isReviewerMode,
            settings.enableThinking
        )

        setStatus(AppStatus.READY)
        setMessages([
            {
                id: 'init',
                role: 'model',
                content: `أهلاً بك! لقد قمت بتحليل المستودع **${details.owner}/${details.repo}**. \nتمت فهرسة ${files.length} ملفاً بنجاح.\n\nيمكنك الآن:\n1. التحدث معي عن الكود.\n2. الانتقال إلى تبويب **Compass** لرؤية الرسم البياني الدلالي.`,
                timestamp: Date.now(),
            },
        ])
    }

    const processPackage = async (query: string, signal: AbortSignal) => {
        setStatus(AppStatus.FETCHING_REPO)
        setStatusMessage(`جاري البحث عن الحزمة ${query}...`)

        const repoUrl = await resolvePackageToRepo(query)
        if (!repoUrl) {
            throw new Error('لم يتم العثور على مستودع GitHub لهذه الحزمة.')
        }

        setStatusMessage(`تم العثور على المستودع: ${repoUrl}`)
        // Reuse existing GitHub flow
        await processGithubRepo(repoUrl, signal)
    }

    const processLocalDirectory = async (signal: AbortSignal) => {
        setStatus(AppStatus.FETCHING_REPO)
        setStatusMessage('جاري قراءة المجلد المحلي...')

        // This will trigger the browser picker
        const { name, tree } = await selectLocalDirectory()

        setRepoInfo({ owner: 'Local', repo: name, defaultBranch: 'local', description: 'Local Directory' })
        setFileTree(tree)

        setStatus(AppStatus.ANALYZING)
        const files = await processLocalFilesForRag(tree, (msg) => setStatusMessage(msg))

        setStatus(AppStatus.INDEXING)
        await ragService.addDocuments(files, (msg) => setStatusMessage(msg))

        // Trigger Semantic Compass Build
        buildGraphAfterIndexing(files, name)

        setStatusMessage('جاري تهيئة المحلل الذكي...')
        const structureContext = `Local Directory: ${name}\nFile Structure (top 200):\n${tree
            .slice(0, 200)
            .map((n) => n.path)
            .join('\n')}`

        await startChatSession(
            resolveModelIdForInput('local'),
            structureContext,
            settings.isReviewerMode,
            settings.enableThinking
        )

        setStatus(AppStatus.READY)
        setMessages([
            {
                id: 'init',
                role: 'model',
                content: `أهلاً بك! لقد قمت بتحليل المجلد المحلي **"${name}"**. \nتمت فهرسة ${files.length} ملفاً بنجاح. يمكنك الآن سؤالي عن محتوى ملفاتك.`,
                timestamp: Date.now(),
            },
        ])
    }

    const processDocUrl = async (url: string, signal: AbortSignal) => {
        setStatus(AppStatus.FETCHING_REPO)
        setStatusMessage('جاري جلب محتوى الصفحة...')

        const { title, content } = await fetchUrlContent(url, signal)
        if (signal.aborted) return

        setDocTitle(title)

        setStatus(AppStatus.INDEXING)
        await ragService.addDocuments([{ path: url, content }], (msg) => setStatusMessage(msg))

        setStatusMessage('جاري تهيئة المحلل...')
        const context = `Documentation URL: ${url}\nTitle: ${title}`
        await startChatSession(
            resolveModelIdForInput('url'),
            context,
            settings.isReviewerMode,
            settings.enableThinking
        )

        setStatus(AppStatus.READY)
        setMessages([
            {
                id: 'init',
                role: 'model',
                content: `أهلاً بك! لقد قمت بقراءة وفهرسة الصفحة **"${title}"**. \nيمكنك الآن سؤالي عن أي تفاصيل موجودة في هذا التوثيق.`,
                timestamp: Date.now(),
            },
        ])
    }

    const processYoutubeVideo = async (url: string, signal: AbortSignal) => {
        setStatus(AppStatus.FETCHING_REPO)
        setStatusMessage('جاري التحقق من الفيديو...')

        const videoId = extractVideoId(url)
        if (!videoId) {
            throw new Error('رابط غير صحيح. يرجى استخدام رابط فيديو يوتيوب صالح.')
        }

        setStatusMessage('جاري جلب النص المفرغ (Transcript)...')
        const { info, transcript } = await fetchYoutubeTranscript(videoId, signal)
        if (signal.aborted) return

        setYoutubeInfo(info)
        setYoutubeTranscript(transcript)

        // Add transcript to RAG Service for analysis
        setStatus(AppStatus.INDEXING)
        await ragService.addDocuments([{ path: `video-${info.videoId}`, content: transcript }], (msg) =>
            setStatusMessage(msg)
        )

        const context = `Video Title: ${info.title}\nChannel: ${info.channel}`
        await startChatSession(
            resolveModelIdForInput('youtube'),
            context,
            settings.isReviewerMode,
            settings.enableThinking
        )

        setStatus(AppStatus.READY)
        setMessages([
            {
                id: 'init',
                role: 'model',
                content: `أهلاً بك! لقد قمت بقراءة محتوى الفيديو **"${info.title}"**. \nيمكنك الآن سؤالي عن أي تفاصيل، تلخيص، أو شرح لما ورد في الفيديو.`,
                timestamp: Date.now(),
            },
        ])
    }

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setSelectedImage({
                    data: (reader.result as string).split(',')[1],
                    mimeType: file.type,
                })
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if ((!inputText.trim() && !selectedImage) || status !== AppStatus.READY) return

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText,
            timestamp: Date.now(),
        }

        setMessages((prev) => [...prev, userMsg])
        setInputText('')

        const imageToSend = selectedImage
        setSelectedImage(null) // Clear image after sending

        try {
            // Basic RAG only on text
            let contextText = ''
            if (inputText.trim()) {
                const retrievedChunks = await ragService.retrieve(userMsg.content)
                contextText = retrievedChunks.map((c) => `Source: ${c.source}\nContent: ${c.text}`).join('\n\n')
            }

            const responseText = await sendMessageToGemini(
                userMsg.content,
                contextText,
                imageToSend ? imageToSend : undefined
            )

            const modelMsg: Message = {
                id: Date.now().toString(),
                role: 'model',
                content: responseText,
                timestamp: Date.now(),
            }

            setMessages((prev) => [...prev, modelMsg])
        } catch (error: any) {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: 'system',
                    content: `عذراً، حدث خطأ: ${error.message}`,
                    timestamp: Date.now(),
                },
            ])
        }
    }

    const handleFileClick = async (file: FileNode) => {
        if (viewMode === 'compass') setViewMode('chat') // Switch back to chat to show content

        const tempId = Date.now().toString()
        setMessages((prev) => [
            ...prev,
            {
                id: tempId,
                role: 'system',
                content: `جاري قراءة الملف: ${file.path}...`,
                timestamp: Date.now(),
            },
        ])

        try {
            let content = ''
            if (file.handle) {
                content = await readLocalFileContent(file.handle)
            } else {
                content = await fetchFileContent(file.url, settings.githubToken)
            }

            setCurrentFileContent(content)

            setMessages((prev) => {
                const filtered = prev.filter((m) => m.id !== tempId)
                return [
                    ...filtered,
                    {
                        id: Date.now().toString(),
                        role: 'model',
                        content: `**محتوى الملف: ${file.path}**\n\`\`\`\n${content}\n\`\`\`\n`,
                        timestamp: Date.now(),
                    },
                ]
            })
        } catch (e) {
            setMessages((prev) => {
                const filtered = prev.filter((m) => m.id !== tempId)
                return [
                    ...filtered,
                    {
                        id: Date.now().toString(),
                        role: 'system',
                        content: `فشل في قراءة الملف: ${file.path}`,
                        timestamp: Date.now(),
                    },
                ]
            })
        }
    }

    const displayedMessages = chatSearchQuery.trim()
        ? messages.filter((m) => m.content.toLowerCase().includes(chatSearchQuery.toLowerCase()))
        : messages

    let currentTitle = ''
    if (repoInfo) currentTitle = repoInfo.repo
    else if (docTitle) currentTitle = docTitle
    else if (youtubeInfo) currentTitle = youtubeInfo.title

    return (
        <div className="flex flex-col h-screen bg-base text-text-secondary font-sans overflow-hidden" dir="rtl">
            {isSettingsOpen && (
                <SettingsModal settings={settings} onUpdate={setSettings} onClose={() => setIsSettingsOpen(false)} />
            )}

            {isDiagramOpen && fileTree.length > 0 && (
                <MermaidDiagram files={fileTree} onClose={() => setIsDiagramOpen(false)} />
            )}

            {activeChallenge && (
                <ChallengeOverlay
                    challenge={activeChallenge}
                    onClose={() => setActiveChallenge(null)}
                    onSubmit={handleChallengeSubmit}
                />
            )}

            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface/80 backdrop-blur-xl z-20 sticky top-0">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div
                        className={`p-2.5 rounded-xl shadow-lg flex-shrink-0 bg-primary/20 text-primary border border-primary/30`}
                    >
                        {inputMode === 'github' ? (
                            <GithubIcon />
                        ) : inputMode === 'url' ? (
                            <GlobeIcon />
                        ) : inputMode === 'local' ? (
                            <FolderIcon />
                        ) : inputMode === 'package' ? (
                            <PackageIcon />
                        ) : inputMode === 'stackoverflow' ? (
                            <StackOverflowIcon />
                        ) : (
                            <YoutubeIcon />
                        )}
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-aurora tracking-tight truncate">
                            GitChat AI
                        </h1>
                        {status === AppStatus.READY && currentTitle ? (
                            <div className="flex md:hidden items-center gap-2 mt-1">
                                <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary"></span>
                                </span>
                                <p className="text-[10px] text-text-secondary truncate max-w-[120px]" dir="ltr">
                                    {currentTitle}
                                </p>
                            </div>
                        ) : (
                            <p className="text-[10px] text-tertiary/70 uppercase tracking-widest font-semibold hidden md:block">
                                Code & Video Analyst
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {status === AppStatus.READY && (
                        <button
                            onClick={handleIgniteChallenge}
                            disabled={isIgniteLoading}
                            className="group relative flex items-center justify-center p-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white shadow-glow-primary transition-all disabled:opacity-50"
                            title="SkillForge: تحدي فوري"
                        >
                            {isIgniteLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
                                        />
                                    </svg>
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2.5 text-text-secondary hover:text-white bg-surface hover:bg-elevated-2 rounded-xl transition-all border border-border-subtle hover:border-tertiary/30"
                        title="الإعدادات"
                    >
                        <SettingsIcon />
                    </button>

                    {status === AppStatus.READY && (
                        <>
                            {/* View Mode Toggle: Chat vs Compass */}
                            {(inputMode === 'github' || inputMode === 'local' || inputMode === 'package') && (
                                <div className="flex bg-surface rounded-xl p-1 border border-border-subtle">
                                    <button
                                        onClick={() => setViewMode('chat')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'chat' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:text-white'}`}
                                    >
                                        Chat
                                    </button>
                                    <button
                                        onClick={() => setViewMode('compass')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${viewMode === 'compass' ? 'bg-tertiary text-base shadow' : 'text-text-secondary hover:text-white'}`}
                                        disabled={!knowledgeGraph}
                                        title={!knowledgeGraph ? 'جاري بناء المخطط...' : 'البوصلة الدلالية'}
                                    >
                                        <CompassIcon />
                                        <span>Compass</span>
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={handleExportChat}
                                className="p-2.5 text-text-secondary hover:text-white bg-surface hover:bg-elevated-2 rounded-xl transition-all border border-border-subtle hover:border-tertiary/30"
                                title="تصدير المحادثة (Markdown)"
                            >
                                <ExportIcon />
                            </button>

                            {(inputMode === 'github' || inputMode === 'local' || inputMode === 'package') && (
                                <button
                                    onClick={() => setIsDiagramOpen(true)}
                                    className="p-2.5 text-tertiary hover:text-white bg-surface hover:bg-tertiary/20 rounded-xl transition-all border border-border-subtle hover:border-tertiary/30"
                                    title="عرض الهيكلية"
                                >
                                    <DiagramIcon />
                                </button>
                            )}

                            <div
                                className={`flex items-center transition-all duration-300 ${isChatSearchOpen ? 'w-48 md:w-64 bg-surface rounded-lg border border-border-subtle' : 'w-8'}`}
                            >
                                {isChatSearchOpen ? (
                                    <>
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="بحث في المحادثة..."
                                            className="w-full bg-transparent border-none text-xs px-3 py-2 focus:ring-0 text-white placeholder-text-secondary"
                                            value={chatSearchQuery}
                                            onChange={(e) => setChatSearchQuery(e.target.value)}
                                        />
                                        <button
                                            onClick={() => {
                                                setIsChatSearchOpen(false)
                                                setChatSearchQuery('')
                                            }}
                                            className="p-2 text-text-secondary hover:text-white"
                                        >
                                            <CloseIcon />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsChatSearchOpen(true)}
                                        className="p-1.5 text-text-secondary hover:text-white transition-colors"
                                        title="بحث"
                                    >
                                        <SearchIcon />
                                    </button>
                                )}
                            </div>

                            {currentTitle && (
                                <div className="hidden md:flex items-center gap-2 text-xs text-text-secondary bg-surface py-2 px-4 rounded-full border border-border-subtle backdrop-blur-md max-w-[200px]">
                                    <span className="relative flex h-2 w-2 flex-shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                                    </span>
                                    <span className="text-white font-medium truncate" dir="ltr">
                                        {currentTitle}
                                    </span>
                                </div>
                            )}

                            {(inputMode === 'github' || inputMode === 'local' || inputMode === 'package') && (
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="p-2.5 text-text-secondary hover:text-white bg-surface hover:bg-elevated-2 rounded-xl transition-all border border-border-subtle hover:border-tertiary/30"
                                    title="عرض الملفات"
                                >
                                    <MenuIcon />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </header>

            {/* Sidebar */}
            <FileSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                files={fileTree}
                onFileClick={handleFileClick}
                onShowDiagram={() => setIsDiagramOpen(true)}
            />

            {/* Main Content */}
            <main
                className={`flex-1 min-h-0 flex flex-col relative max-w-5xl mx-auto w-full transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isSidebarOpen ? 'mr-0 md:mr-80' : ''}`}
            >
                {(status === AppStatus.IDLE ||
                    status === AppStatus.ERROR ||
                    status === AppStatus.FETCHING_REPO ||
                    status === AppStatus.ANALYZING ||
                    status === AppStatus.INDEXING ||
                    status === AppStatus.BUILDING_GRAPH) && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in relative z-10">
                        {/* Same status content as before ... */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

                        <div className="max-w-md w-full space-y-8 relative">
                            <div className="space-y-3">
                                <h2 className="text-4xl font-bold text-white tracking-tight">
                                    GitChat <span className="text-transparent bg-clip-text bg-gradient-aurora">AI</span>
                                </h2>
                                <p className="text-text-secondary text-lg font-light leading-relaxed">
                                    مساعد ذكي لتحليل المستودعات، التوثيق، والفيديو باستخدام RAG.
                                </p>
                            </div>

                            <div className="flex flex-wrap p-1 bg-surface backdrop-blur-sm rounded-xl border border-border-subtle w-fit mx-auto overflow-hidden justify-center gap-1">
                                <button
                                    onClick={() => setInputMode('github')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${inputMode === 'github' ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
                                >
                                    GitHub
                                </button>
                                <button
                                    onClick={() => setInputMode('package')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${inputMode === 'package' ? 'bg-secondary text-base shadow-lg' : 'text-text-secondary hover:text-white'}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                        />
                                    </svg>
                                    <span>Package</span>
                                </button>
                                <button
                                    onClick={() => setInputMode('local')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${inputMode === 'local' ? 'bg-tertiary text-base shadow-lg' : 'text-text-secondary hover:text-white'}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                        />
                                    </svg>
                                    <span>Local</span>
                                </button>
                                <button
                                    onClick={() => setInputMode('url')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${inputMode === 'url' ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
                                >
                                    URL
                                </button>
                                <button
                                    onClick={() => setInputMode('stackoverflow')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${inputMode === 'stackoverflow' ? 'bg-[#F48024] text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.986 21.865v-6.404h2.134V24H1.844v-8.539h2.13v6.404h15.012zM6.111 19.79h12.668v-2.125H6.111v2.125zm.94-5.43l12.151 2.591.473-2.06L7.522 12.3l-.472 2.06zm1.733-5.085l10.95 6.435 1.066-1.839-10.95-6.435-1.066 1.839zm3.118-4.711l8.635 9.323 1.55-1.464-8.635-9.322-1.55 1.463zM14.507.085l-1.91 1.413 5.968 12.307 1.91-1.413L14.507.085z" />
                                    </svg>
                                    <span>StackOverflow</span>
                                </button>
                                <button
                                    onClick={() => setInputMode('youtube')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${inputMode === 'youtube' ? 'bg-[#ef4444] text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                    <span>YouTube</span>
                                </button>
                            </div>

                            <form onSubmit={handleStartAnalysis} className="space-y-4">
                                <div className="relative group">
                                    {inputMode === 'local' ? (
                                        <button
                                            type="button"
                                            onClick={(e) => handleStartAnalysis(e)}
                                            className="relative w-full bg-elevated-2 text-secondary font-mono text-sm border border-secondary/30 border-dashed rounded-2xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-secondary/50 hover:bg-surface transition-all shadow-glow-secondary flex items-center justify-center gap-3 group-hover:border-secondary/60"
                                        >
                                            <svg
                                                className="w-6 h-6"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                            <span className="font-semibold text-lg">اختيار مجلد من الجهاز</span>
                                        </button>
                                    ) : (
                                        <input
                                            type="text"
                                            value={urlInput}
                                            onChange={handleInputChange}
                                            placeholder={
                                                inputMode === 'github'
                                                    ? 'https://github.com/owner/repo'
                                                    : inputMode === 'url'
                                                      ? 'https://docs.example.com/...'
                                                      : inputMode === 'stackoverflow'
                                                        ? 'https://stackoverflow.com/questions/...'
                                                        : inputMode === 'package'
                                                          ? 'react, pandas, lodash...'
                                                          : 'https://youtube.com/watch?v=...'
                                            }
                                            className="relative w-full bg-elevated-2 text-white placeholder-text-secondary border border-border-subtle rounded-2xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-xl text-left font-mono text-sm"
                                            dir="ltr"
                                            disabled={status !== AppStatus.IDLE && status !== AppStatus.ERROR}
                                        />
                                    )}
                                </div>

                                {status !== AppStatus.IDLE && status !== AppStatus.ERROR ? (
                                    <div className="flex gap-2">
                                        <button
                                            disabled
                                            className="flex-1 bg-surface border border-border-subtle text-text-secondary font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 cursor-wait"
                                        >
                                            <Loader />
                                            <span className="text-sm">
                                                {status === AppStatus.FETCHING_REPO
                                                    ? 'جاري الاتصال...'
                                                    : status === AppStatus.ANALYZING
                                                      ? 'جلب الملفات...'
                                                      : status === AppStatus.BUILDING_GRAPH
                                                        ? 'بناء البوصلة الدلالية...'
                                                        : 'فهرسة المحتوى (RAG)...'}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="px-6 bg-error/10 border border-error/30 text-error hover:bg-error/20 rounded-2xl transition-colors font-medium text-sm"
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                ) : (
                                    inputMode !== 'local' && (
                                        <button
                                            type="submit"
                                            disabled={!urlInput}
                                            className={`w-full text-white font-semibold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 text-lg bg-primary hover:bg-primary-dark shadow-glow-primary disabled:bg-surface disabled:text-text-secondary disabled:cursor-not-allowed`}
                                        >
                                            <span>بدء التحليل</span>
                                            <svg
                                                className="w-5 h-5 transform rotate-180"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                                />
                                            </svg>
                                        </button>
                                    )
                                )}
                            </form>

                            {/* Same error message rendering... */}
                            {status === AppStatus.ERROR && (
                                <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3 text-red-200 text-sm backdrop-blur-sm animate-shake text-right">
                                    <svg
                                        className="w-5 h-5 text-error flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                        />
                                    </svg>
                                    <span>{statusMessage}</span>
                                </div>
                            )}

                            {/* Same status text... */}
                            {(status === AppStatus.ANALYZING ||
                                status === AppStatus.INDEXING ||
                                status === AppStatus.FETCHING_REPO ||
                                status === AppStatus.BUILDING_GRAPH) && (
                                <div
                                    className="text-sm text-tertiary animate-pulse font-mono bg-tertiary/5 p-3 rounded-lg border border-tertiary/10"
                                    dir="ltr"
                                >
                                    &gt; {statusMessage}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {status === AppStatus.READY && (
                    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
                        {viewMode === 'compass' && knowledgeGraph ? (
                            <GraphView data={knowledgeGraph} />
                        ) : (
                            <>
                                {/* YouTube Player Panel - No changes */}
                                {youtubeInfo && (
                                    <div className="px-4 py-4 border-b border-border-subtle bg-black/20 shrink-0">
                                        <div className="max-w-2xl mx-auto flex flex-col md:flex-row gap-4">
                                            <div className="flex-1">
                                                <YouTubePlayer ref={playerRef} videoId={youtubeInfo.videoId} />
                                            </div>
                                            <div className="flex flex-col justify-center gap-3">
                                                <h3 className="text-sm font-medium text-white line-clamp-2">
                                                    {youtubeInfo.title}
                                                </h3>
                                                <button
                                                    onClick={handleSmartChapters}
                                                    className="px-3 py-2 bg-primary/20 hover:bg-primary/40 text-tertiary text-xs rounded-lg border border-primary/30 flex items-center gap-2 transition-all w-fit"
                                                >
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                                        />
                                                    </svg>
                                                    تلخيص الفصول (Smart Chapters)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div
                                    ref={chatScrollRef}
                                    onScroll={handleChatScroll}
                                    className="flex-1 min-h-0 overflow-y-auto px-4 py-6 scroll-smooth"
                                >
                                    <div className="max-w-3xl mx-auto space-y-6 pb-24">
                                        {displayedMessages.map((msg) => (
                                            <ChatBubble
                                                key={msg.id}
                                                message={msg}
                                                onTimestampClick={
                                                    youtubeInfo ? (sec) => playerRef.current?.seekTo(sec) : undefined
                                                }
                                            />
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-base via-base to-transparent pt-10">
                                    <div className="max-w-3xl mx-auto">
                                        <form
                                            onSubmit={handleSendMessage}
                                            className="relative flex flex-col bg-elevated-2/90 backdrop-blur-xl border border-border-subtle shadow-2xl rounded-2xl ring-1 ring-white/5 group focus-within:ring-primary/50 transition-all"
                                        >
                                            {selectedImage && (
                                                <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between animate-fade-in bg-base/50 rounded-t-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-12 w-12 rounded-lg bg-black/50 overflow-hidden border border-border-subtle">
                                                            <img
                                                                src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`}
                                                                alt="Selected"
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="text-xs text-text-secondary">
                                                            <div className="text-white font-medium">Image Selected</div>
                                                            <div>{selectedImage.mimeType}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedImage(null)}
                                                        className="p-1.5 hover:bg-white/10 rounded-full text-text-secondary hover:text-white"
                                                    >
                                                        <CloseIcon />
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex items-center w-full">
                                                <input
                                                    type="text"
                                                    value={inputText}
                                                    onChange={(e) => setInputText(e.target.value)}
                                                    placeholder={
                                                        inputMode === 'youtube'
                                                            ? 'اسأل عن محتوى الفيديو...'
                                                            : 'اكتب سؤالك هنا...'
                                                    }
                                                    className="w-full bg-transparent text-white placeholder-text-secondary px-6 py-4.5 rounded-b-2xl focus:outline-none text-base pl-12"
                                                />
                                                <div className="absolute left-2 flex items-center pr-2 gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="p-2 text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
                                                        title="إرفاق صورة"
                                                    >
                                                        <ImageIcon />
                                                    </button>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsChatSearchOpen(true)}
                                                        className="p-2 text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
                                                        title="بحث في المحادثة"
                                                    >
                                                        <SearchIcon />
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={!inputText.trim() && !selectedImage}
                                                        className={`p-2.5 hover:bg-opacity-90 disabled:bg-surface disabled:text-text-secondary text-white rounded-xl transition-all shadow-lg active:scale-95 bg-primary shadow-glow-primary`}
                                                    >
                                                        <SendIcon />
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {status === AppStatus.READY && <SkillTreeWidget profile={userProfile} />}
            </main>
        </div>
    )
}

export default App
