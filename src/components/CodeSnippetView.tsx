import { Highlight, themes } from "prism-react-renderer";
import { useTheme } from "@/context/ThemeContext";
import type { Language } from "@/lib/types";

export function CodeSnippetView({
  code,
  language,
}: {
  code: string;
  language: Language | undefined;
}) {
  const { resolved } = useTheme();
  const theme = resolved === "dark" ? themes.vsDark : themes.vsLight;
  return (
    <Highlight code={code.trimEnd()} language={language ?? "text"} theme={theme}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${className} overflow-x-auto rounded-md border border-slate-200 p-3 text-sm leading-relaxed dark:border-slate-700`}
          style={style}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              <span className="select-none pr-3 text-slate-400">
                {String(i + 1).padStart(2, " ")}
              </span>
              {line.map((token, k) => (
                <span key={k} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
