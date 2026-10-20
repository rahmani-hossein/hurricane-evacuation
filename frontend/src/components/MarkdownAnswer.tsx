import React from 'react';

const inline = (value: string) => {
  const parts = value.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^\)]+\))/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="rounded bg-slate-950 px-1 py-0.5 text-blue-200">{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer" className="text-blue-300 underline decoration-blue-500/50 underline-offset-2">{link[1]}</a>;
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

export const MarkdownAnswer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="my-2 list-disc space-y-1 pl-5">
        {list.map((item, index) => <li key={index}>{inline(item)}</li>)}
      </ul>
    );
    list = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const bullet = trimmed.match(/^[-*]\s+(.+)/);
    if (bullet) { list.push(bullet[1]); return; }
    flushList();
    if (!trimmed) return;
    const heading = trimmed.match(/^#{1,3}\s+(.+)/);
    if (heading) {
      blocks.push(<h4 key={`heading-${index}`} className="mt-3 mb-1 font-semibold text-white">{inline(heading[1])}</h4>);
      return;
    }
    blocks.push(<p key={`paragraph-${index}`} className="my-2">{inline(trimmed)}</p>);
  });
  flushList();
  return <div className="text-slate-200 leading-relaxed">{blocks}</div>;
};
