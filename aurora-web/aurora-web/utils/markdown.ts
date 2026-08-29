/**
 * A lightweight, safe Markdown to HTML parser
 */
export function parseMarkdown(md: string): string {
  if (!md) return "";

  // 1. Escape HTML tags to prevent XSS (allowing only safe constructs we generate)
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Normalize line endings
  html = html.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 3. Code Blocks: ```code```
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    return `<pre class="bg-black/40 p-4 rounded-xl border border-white/10 font-mono text-xs overflow-x-auto text-gray-300 my-4">${code.trim()}</pre>`;
  });

  // 4. Inline Code: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-black/50 px-1.5 py-0.5 rounded text-pink-400 font-mono text-sm">$1</code>');

  // 5. Headers: #, ##, ###
  html = html.replace(/^### (.*)$/gm, '<h3 class="text-lg font-bold text-white mt-6 mb-2">$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2 class="text-xl font-bold text-white mt-8 mb-3 border-b border-white/10 pb-1">$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1 class="text-2xl font-bold text-white mt-10 mb-4 pb-2 border-b border-white/20">$1</h1>');

  // 6. Horizontal Rules: ---
  html = html.replace(/^---$/gm, '<hr class="border-white/10 my-6" />');

  // 7. Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // 8. Blockquotes: > text
  html = html.replace(/^&gt;\s+(.*)$/gm, '<blockquote class="border-l-4 border-purple-500 pl-4 py-1 my-4 text-gray-400 italic bg-white/5 rounded-r-lg">$1</blockquote>');

  // 9. Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-purple-400 hover:text-purple-300 underline font-medium">$1</a>');

  // 10. Lists: - item or * item
  // Capture sequential list items and wrap them in ul
  html = html.replace(/^(\s*)[-*+]\s+(.*)$/gm, '<li class="text-gray-300 ml-4 list-disc mb-1">$2</li>');

  // 11. Paragraphs (split by double newlines)
  const blocks = html.split(/\n{2,}/);
  const parsedBlocks = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return "";
    
    // If it's already a block element we generated, return as-is
    if (
      trimmed.startsWith('<h') || 
      trimmed.startsWith('<pre') || 
      trimmed.startsWith('<blockquote') || 
      trimmed.startsWith('<li') ||
      trimmed.startsWith('<hr')
    ) {
      return trimmed;
    }
    
    // Otherwise, wrap in paragraph
    return `<p class="mb-4 text-gray-300 leading-relaxed">${trimmed.replace(/\n/g, '<br />')}</p>`;
  });

  return parsedBlocks.join('\n');
}
