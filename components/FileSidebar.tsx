import React, { useMemo, useState } from 'react'
import { FileNode } from '../types'

interface FileSidebarProps {
    isOpen: boolean
    onClose: () => void
    files: FileNode[]
    onFileClick: (file: FileNode) => void
    onShowDiagram: () => void
}

interface TreeNode {
    name: string
    path: string
    type: 'file' | 'folder'
    children: TreeNode[]
    originalNode?: FileNode
}

const buildTree = (files: FileNode[]): TreeNode[] => {
    const root: TreeNode[] = []
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path))

    sortedFiles.forEach((file) => {
        const parts = file.path.split('/')
        let currentLevel = root
        let currentPath = ''

        parts.forEach((part, index) => {
            currentPath = currentPath ? `${currentPath}/${part}` : part

            let existingNode = currentLevel.find((node) => node.name === part)

            if (!existingNode) {
                const isFile = index === parts.length - 1 && file.type === 'blob'
                const newNode: TreeNode = {
                    name: part,
                    path: currentPath,
                    type: isFile ? 'file' : 'folder',
                    children: [],
                    originalNode: isFile ? file : undefined,
                }

                currentLevel.push(newNode)
                existingNode = newNode
            }

            if (existingNode.type === 'folder') {
                currentLevel = existingNode.children
            }
        })
    })

    return root
}

const TreeNodeComponent: React.FC<{ node: TreeNode; onFileClick: (file: FileNode) => void; depth: number }> = ({
    node,
    onFileClick,
    depth,
}) => {
    const [isExpanded, setIsExpanded] = useState(true)

    const handleClick = () => {
        if (node.type === 'folder') {
            setIsExpanded(!isExpanded)
        } else if (node.originalNode) {
            onFileClick(node.originalNode)
        }
    }

    const FolderIcon = () => (
        <svg
            className={`w-4 h-4 mr-2 text-tertiary/70 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    )

    const FileIcon = () => (
        <svg className="w-4 h-4 mr-2 text-primary/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
        </svg>
    )

    return (
        <div className="select-none">
            <div
                className={`flex items-center py-1.5 px-3 cursor-pointer hover:bg-primary/10 rounded-lg text-sm text-text-secondary hover:text-white transition-colors duration-200 mb-0.5`}
                style={{ paddingRight: `${depth * 16 + 12}px` }}
                onClick={handleClick}
            >
                {node.type === 'folder' ? <FolderIcon /> : <FileIcon />}
                <span className="truncate font-normal tracking-wide">{node.name}</span>
            </div>
            {isExpanded && node.children.length > 0 && (
                <div>
                    {node.children.map((child) => (
                        <TreeNodeComponent key={child.path} node={child} onFileClick={onFileClick} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    )
}

const FileSidebar: React.FC<FileSidebarProps> = ({ isOpen, onClose, files, onFileClick, onShowDiagram }) => {
    const [activeFilter, setActiveFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const extensions = useMemo(() => {
        const exts = new Set<string>()
        files.forEach((f) => {
            if (f.type === 'blob') {
                const match = f.path.match(/\.([a-z0-9]+)$/i)
                if (match) exts.add(match[1].toLowerCase())
            }
        })
        return Array.from(exts).sort()
    }, [files])

    const tree = useMemo(() => {
        const filteredFiles = files.filter((f) => {
            if (f.type !== 'blob') return false
            const name = f.path.toLowerCase()
            const extMatch = activeFilter === 'all' || name.endsWith(`.${activeFilter}`)
            const searchMatch = !searchQuery || name.includes(searchQuery.toLowerCase())
            return extMatch && searchMatch
        })
        return buildTree(filteredFiles)
    }, [files, activeFilter, searchQuery])

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            <div
                className={`fixed inset-y-0 right-0 w-80 bg-elevated-1/95 backdrop-blur-xl border-l border-border-subtle shadow-2xl z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                } flex flex-col`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-base shrink-0">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                        </svg>
                        <h2 className="text-white font-semibold tracking-tight">ملفات المشروع</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {files.length > 0 && (
                            <button
                                onClick={onShowDiagram}
                                className="p-1.5 rounded-md text-tertiary hover:bg-tertiary/10 hover:text-white transition-colors"
                                title="عرض المخطط الهيكلي"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                                    />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1 rounded-md text-text-secondary hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-3 py-3 border-b border-border-subtle shrink-0">
                    <div className="relative group">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg
                                className="h-4 w-4 text-text-secondary group-focus-within:text-primary transition-colors"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="بحث في الملفات..."
                            className="block w-full bg-elevated-2 text-white text-xs rounded-lg border border-border-subtle py-2 pr-9 pl-3 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 placeholder-text-secondary transition-all"
                        />
                    </div>
                </div>

                {/* Filters */}
                {extensions.length > 0 && (
                    <div
                        className="px-3 py-3 border-b border-border-subtle overflow-x-auto whitespace-nowrap custom-scrollbar shrink-0"
                        dir="rtl"
                    >
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ml-2 ${
                                activeFilter === 'all'
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'bg-surface text-text-secondary hover:bg-elevated-2 hover:text-white'
                            }`}
                        >
                            الكل
                        </button>
                        {extensions.map((ext) => (
                            <button
                                key={ext}
                                onClick={() => setActiveFilter(ext)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ml-2 ${
                                    activeFilter === ext
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'bg-surface text-text-secondary hover:bg-elevated-2 hover:text-white'
                                }`}
                            >
                                .{ext}
                            </button>
                        ))}
                    </div>
                )}

                {/* Tree */}
                <div className="overflow-y-auto flex-1 p-3 dir-rtl custom-scrollbar">
                    {tree.length === 0 ? (
                        <div className="flex flex-col items-center justify-center mt-10 text-text-secondary space-y-2">
                            <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span className="text-sm">لا توجد ملفات مطابقة</span>
                        </div>
                    ) : (
                        tree.map((node) => (
                            <TreeNodeComponent key={node.path} node={node} onFileClick={onFileClick} depth={0} />
                        ))
                    )}
                </div>
            </div>
        </>
    )
}

export default FileSidebar
