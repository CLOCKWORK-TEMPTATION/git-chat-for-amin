import React from 'react'
import { AppSettings, AVAILABLE_MODELS, AiModelId } from '../types'

interface SettingsModalProps {
    settings: AppSettings
    onUpdate: (newSettings: AppSettings) => void
    onClose: () => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdate, onClose }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-elevated-3 w-full max-w-md rounded-2xl border border-border-subtle shadow-2xl flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b border-border-subtle bg-base/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg
                            className="w-5 h-5 text-text-secondary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                        الإعدادات
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white transition-colors"
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

                <div className="p-6 space-y-6">
                    {/* Reviewer Mode Toggle */}
                    <div className="flex items-center justify-between p-3 bg-base rounded-xl border border-border-subtle">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">المراجع الذكي (Code Reviewer)</div>
                                <div className="text-[10px] text-text-secondary">تدقيق صارم للكود، اكتشاف الثغرات.</div>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.isReviewerMode}
                                onChange={(e) => onUpdate({ ...settings, isReviewerMode: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {/* Thinking Mode Toggle */}
                    <div
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${settings.modelId === 'gemini-3-pro-preview' ? 'bg-base border-border-subtle' : 'bg-base/30 border-transparent opacity-50 cursor-not-allowed'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-tertiary/10 rounded-lg text-tertiary">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">التفكير العميق (Thinking Mode)</div>
                                <div className="text-[10px] text-text-secondary">
                                    متاح فقط مع نموذج Gemini 3 Pro (Thinking Budget: 32k).
                                </div>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.enableThinking}
                                disabled={settings.modelId !== 'gemini-3-pro-preview'}
                                onChange={(e) => onUpdate({ ...settings, enableThinking: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-tertiary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tertiary"></div>
                        </label>
                    </div>

                    {/* GitHub Token */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">
                            رمز الوصول الشخصي (GitHub Token)
                        </label>
                        <input
                            type="password"
                            value={settings.githubToken}
                            onChange={(e) => onUpdate({ ...settings, githubToken: e.target.value })}
                            placeholder="ghp_..."
                            className="w-full bg-base border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all"
                        />
                    </div>

                    {/* AI Model */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-text-secondary">نموذج الذكاء الاصطناعي</label>
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {AVAILABLE_MODELS.map((model) => (
                                <div
                                    key={model.id}
                                    onClick={() => onUpdate({ ...settings, modelId: model.id })}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                                        settings.modelId === model.id
                                            ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/30'
                                            : 'bg-base border-border-subtle hover:border-text-secondary/30'
                                    }`}
                                >
                                    <div
                                        className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center ${settings.modelId === model.id ? 'border-primary' : 'border-text-secondary'}`}
                                    >
                                        {settings.modelId === model.id && (
                                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                                        )}
                                    </div>
                                    <div>
                                        <div
                                            className={`text-sm font-medium ${settings.modelId === model.id ? 'text-white' : 'text-text-secondary'}`}
                                        >
                                            {model.name}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">{model.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-border-subtle bg-base/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-glow-primary"
                    >
                        حفظ وإغلاق
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SettingsModal
