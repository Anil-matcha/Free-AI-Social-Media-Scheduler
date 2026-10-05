import { Extension } from "@tiptap/core";
import Suggestion, { exitSuggestion } from "@tiptap/suggestion";

const command = (action) => (editor, range) => {
  editor.chain().focus().deleteRange(range).run();
  action(editor);
};

export const blocks = [
  {
    category: "Generate",
    title: "Generate",
    description: "Describe what you want to write",
    icon: "✨",
    run: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: "aiPrompt" })
        .run();
    },
  },
  {
    category: "Generate",
    title: "Generate Image",
    description: "Create image with GPT-Image-2",
    icon: "🖼️",
    run: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: "aiImagePrompt" })
        .run();
    },
  },
  {
    category: "Basic",
    title: "Text",
    description: "Start with a plain paragraph",
    icon: "T",
    run: command((e) => e.chain().setParagraph().run()),
  },
  {
    category: "Basic",
    title: "Heading 1",
    description: "A large section heading (#)",
    icon: "H1",
    run: command((e) => e.chain().setHeading({ level: 1 }).run()),
  },
  {
    category: "Basic",
    title: "Heading 2",
    description: "A medium section heading (##)",
    icon: "H2",
    run: command((e) => e.chain().setHeading({ level: 2 }).run()),
  },
  {
    category: "Basic",
    title: "Heading 3",
    description: "A small section heading (###)",
    icon: "H3",
    run: command((e) => e.chain().setHeading({ level: 3 }).run()),
  },
  {
    category: "Basic",
    title: "Bullet list",
    description: "A simple unordered list (•)",
    icon: "•",
    run: command((e) => e.chain().toggleBulletList().run()),
  },
  {
    category: "Basic",
    title: "Numbered list",
    description: "An ordered sequence (1, 2, 3)",
    icon: "1.",
    run: command((e) => e.chain().toggleOrderedList().run()),
  },
  {
    category: "Basic",
    title: "Checklist",
    description: "Track tasks with checkable boxes",
    icon: "☑",
    run: command((e) => e.chain().toggleTaskList().run()),
  },
  {
    category: "Basic",
    title: "Table",
    description: "Interactive 3x3 table with header",
    icon: "⊞",
    run: command((e) =>
      e.chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    ),
  },
  {
    category: "Basic",
    title: "Quote",
    description: "Highlight a passage or blockquote (>)",
    icon: "“",
    run: command((e) => e.chain().toggleBlockquote().run()),
  },
  {
    category: "Basic",
    title: "Divider",
    description: "Separate sections with a horizontal line",
    icon: "—",
    run: command((e) => e.chain().setHorizontalRule().run()),
  },
  {
    category: "Code",
    title: "Code (JavaScript)",
    description: "JavaScript syntax code block",
    icon: "JS",
    run: command((e) => e.chain().toggleCodeBlock({ language: "javascript" }).run()),
  },
  {
    category: "Code",
    title: "Code (Python)",
    description: "Python syntax code block",
    icon: "PY",
    run: command((e) => e.chain().toggleCodeBlock({ language: "python" }).run()),
  },
  {
    category: "Code",
    title: "Code (HTML / CSS)",
    description: "Web markup and styles block",
    icon: "<>",
    run: command((e) => e.chain().toggleCodeBlock({ language: "html" }).run()),
  },
  {
    category: "Code",
    title: "Code (SQL)",
    description: "Database queries and schema block",
    icon: "DB",
    run: command((e) => e.chain().toggleCodeBlock({ language: "sql" }).run()),
  },
  {
    category: "Code",
    title: "Code (Bash / Shell)",
    description: "Terminal commands and scripts block",
    icon: "$_",
    run: command((e) => e.chain().toggleCodeBlock({ language: "bash" }).run()),
  },
  {
    category: "Code",
    title: "Code (Plain Text)",
    description: "Generic monospace code block",
    icon: "{ }",
    run: command((e) => e.chain().toggleCodeBlock({ language: "plaintext" }).run()),
  },
];

export const SlashCommands = Extension.create({
  name: "slashCommands",
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        startOfLine: false,
        allowedPrefixes: null,
        items: ({ query }) =>
          blocks.filter((block) =>
            `${block.category || ""} ${block.title} ${block.description}`
              .toLowerCase()
              .includes(query.toLowerCase())
          ),
        command: ({ editor, range, props }) => props.run(editor, range),
        render: () => {
          let menu;
          let current;
          let index = 0;
          const close = () => {
            menu?.remove();
            menu = undefined;
            const dom = current?.editor.view.dom;
            dom?.removeAttribute("aria-controls");
            dom?.removeAttribute("aria-activedescendant");
            dom?.removeAttribute("aria-autocomplete");
            document.removeEventListener("pointerdown", outside);
          };
          const outside = (event) => {
            if (menu && !menu.contains(event.target)) {
              if (current) exitSuggestion(current.editor.view);
              close();
            }
          };
          const paint = () => {
            if (!menu || !current) return;
            const props = current;
            menu.replaceChildren();

            if (!props.items.length) {
              const empty = document.createElement("p");
              empty.className = "slash-menu-empty";
              empty.textContent = "No matching blocks";
              menu.append(empty);
              return;
            }

            let lastCategory = null;

            props.items.forEach((item, i) => {
              if (item.category && item.category !== lastCategory) {
                lastCategory = item.category;
                const catLabel = document.createElement("div");
                catLabel.className = "slash-menu-label";
                catLabel.textContent = item.category.toUpperCase();
                menu.append(catLabel);
              }

              const button = document.createElement("button");
              button.type = "button";
              button.id = `slash-block-${i}`;
              button.setAttribute("role", "option");
              button.setAttribute("aria-selected", String(i === index));
              button.className = i === index ? "selected" : "";

              const iconBadge = document.createElement("span");
              iconBadge.className = `slash-block-icon ${item.category === "Generate" ? "ai-badge" : ""}`;
              iconBadge.textContent = item.icon || "•";

              const textWrap = document.createElement("div");
              textWrap.className = "slash-block-text";

              const title = document.createElement("strong");
              title.textContent = item.title;

              const description = document.createElement("span");
              description.textContent = item.description;

              textWrap.append(title, description);
              button.append(iconBadge, textWrap);

              button.addEventListener("mousedown", (event) =>
                event.preventDefault()
              );
              button.addEventListener("click", () => props.command(item));
              menu.append(button);
            });
            const rect = props.clientRect?.();
            if (rect) {
              menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - 260))}px`;
              menu.style.top = `${Math.max(12, Math.min(rect.bottom + 6, window.innerHeight - 300))}px`;
            }
            props.editor.view.dom.setAttribute(
              "aria-activedescendant",
              `slash-block-${index}`
            );
            menu
              .querySelector(".selected")
              ?.scrollIntoView({ block: "nearest" });
          };
          return {
            onStart: (props) => {
              current = props;
              index = 0;
              menu = document.createElement("div");
              menu.id = "document-block-menu";
              menu.className = "slash-menu";
              menu.setAttribute("role", "listbox");
              menu.setAttribute("aria-label", "Insert block");
              document.body.append(menu);
              props.editor.view.dom.setAttribute("aria-controls", menu.id);
              props.editor.view.dom.setAttribute("aria-autocomplete", "list");
              document.addEventListener("pointerdown", outside);
              paint();
            },
            onUpdate: (props) => {
              current = props;
              index = 0;
              paint();
            },
            onExit: close,
            onKeyDown: ({ event, view }) => {
              if (event.isComposing || view.composing || event.keyCode === 229)
                return false;
              if (event.key === "Escape") {
                exitSuggestion(view);
                close();
                return true;
              }
              if (!current?.items.length) return false;
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                index =
                  (index +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    current.items.length) %
                  current.items.length;
                paint();
                return true;
              }
              if (event.key === "Enter") {
                current.command(current.items[index]);
                return true;
              }
              return false;
            },
          };
        },
      }),
    ];
  },
});
