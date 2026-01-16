
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { FileNode } from '../types';

interface MermaidDiagramProps {
  files: FileNode[];
  onClose: () => void;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ files, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: false, 
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'IBM Plex Sans Arabic'
    });
    
    renderDiagram();
  }, [files]);

  const generateMermaidDefinition = (files: FileNode[]) => {
    // We can't render thousands of files, so we limit depth and folders
    const rootFolders = new Set<string>();
    const topLevelFiles: string[] = [];
    const relations: string[] = [];
    
    // Sort to get clean structure
    const sorted = [...files].sort((a, b) => a.path.length - b.path.length);

    sorted.forEach(file => {
        const parts = file.path.split('/');
        if (parts.length === 1) {
            if (file.type === 'blob') {
                topLevelFiles.push(parts[0]);
            } else {
                rootFolders.add(parts[0]);
            }
        } else if (parts.length === 2) {
             // Link root folder to 2nd level items
             const parent = parts[0];
             const child = parts[1];
             rootFolders.add(parent); // Ensure parent exists
             relations.push(`${parent} --> ${child.replace(/[\.\-\s]/g, '_')}[${child}]`);
        }
    });

    let def = "graph TD;\n";
    def += "  root[Repository]:::rootClass;\n";
    
    // Add Root folders
    Array.from(rootFolders).forEach(f => {
        def += `  root --> ${f.replace(/[\.\-\s]/g, '_')}[📂 ${f}];\n`;
    });

    // Add Root files (limit to top 10 to avoid noise)
    topLevelFiles.slice(0, 10).forEach(f => {
        def += `  root --> ${f.replace(/[\.\-\s]/g, '_')}[📄 ${f}];\n`;
    });

    // Add 2nd level relations (limit to 30 edges total)
    relations.slice(0, 30).forEach(r => {
        def += `  ${r};\n`;
    });
    
    // Styles
    def += "  classDef rootClass fill:#5A5296,stroke:#453F78,color:white;\n";
    
    return def;
  };

  const renderDiagram = async () => {
    if (!containerRef.current) return;
    
    try {
      const definition = generateMermaidDefinition(files);
      // Use unique ID to prevent conflicts in React lifecycle re-renders
      const id = `mermaid-svg-${Date.now()}`;
      const { svg } = await mermaid.render(id, definition);
      if (containerRef.current) {
          containerRef.current.innerHTML = svg;
      }
    } catch (e) {
      console.error("Mermaid error:", e);
      setError("لا يمكن عرض المخطط لهذا المستودع لأنه كبير جداً.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-base w-full max-w-4xl h-[80vh] rounded-2xl border border-border-subtle shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border-subtle bg-elevated-2">
           <h3 className="text-lg font-semibold text-white flex items-center gap-2">
             <svg className="w-5 h-5 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
             هيكلية المشروع (مبسطة)
           </h3>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#050508] relative" dir="ltr">
            {error ? (
                <div className="text-error flex flex-col items-center gap-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span>{error}</span>
                </div>
            ) : (
                <div ref={containerRef} className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full"></div>
            )}
        </div>
        
        <div className="p-3 bg-elevated-2 text-xs text-text-secondary text-center border-t border-border-subtle">
            يتم عرض أهم المجلدات والملفات فقط للحفاظ على وضوح المخطط
        </div>
      </div>
    </div>
  );
};

export default MermaidDiagram;
