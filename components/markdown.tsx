import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-semibold mt-4 mb-2 text-balance">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold mt-3 mb-1.5 text-balance">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold mt-2 mb-1 text-balance">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="text-sm leading-relaxed mb-2 last:mb-0 text-pretty">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="text-sm list-disc pl-4 mb-2 space-y-0.5">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="text-sm list-decimal pl-4 mb-2 space-y-0.5">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="text-pretty">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            {children}
          </a>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className="block bg-neutral-900 rounded-lg p-3 text-xs font-mono overflow-x-auto mb-2">
                {children}
              </code>
            );
          }
          return (
            <code className="bg-neutral-800 rounded px-1.5 py-0.5 text-xs font-mono">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <pre className="mb-2 last:mb-0">{children}</pre>,
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2">
            <table className="text-sm border-collapse w-full">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b border-neutral-700">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="text-left px-2 py-1.5 text-xs font-semibold text-neutral-400 tabular-nums">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-2 py-1.5 border-b border-neutral-800 tabular-nums">
            {children}
          </td>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-neutral-600 pl-3 text-neutral-400 mb-2">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="border-neutral-800 my-3" />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
