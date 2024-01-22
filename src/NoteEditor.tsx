import { useCallback, useEffect, useRef, useState } from "react";
import { Note } from "./store/types";
import { lowlight } from "lowlight";
import { EditorContent, useEditor, JSONContent } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Placeholder from "@tiptap/extension-placeholder";
import { ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import "./css/NoteEditor.module.css";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import OrderedList from "@tiptap/extension-list-item";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Link from "@tiptap/extension-link";
import Text from "@tiptap/extension-text";
import { NoteLabel } from "./lib/tiptap/NoteLabel";
import NoteLabels from "./components/NoteLabel";
import Mathblock from "./lib/tiptap/math-block/Index";
import { Filesystem, FilesystemDirectory } from "@capacitor/filesystem";
import CodeBlockComponent from "./lib/tiptap/CodeBlockComponent";
import HeadingTree from "./lib/HeadingTree";
// import Paper from "./lib/tiptap/paper/Paper"

// Icons

import BoldIcon from "remixicon-react/BoldIcon";
import MarkPenLineIcon from "remixicon-react/MarkPenLineIcon";
import ImageLineIcon from "remixicon-react/ImageLineIcon";
import ListOrderedIcon from "remixicon-react/ListOrderedIcon";
import ItalicIcon from "remixicon-react/ItalicIcon";
import UnderlineIcon from "remixicon-react/UnderlineIcon";
import StrikethroughIcon from "remixicon-react/StrikethroughIcon";
import ArrowLeftSLineIcon from "remixicon-react/ArrowLeftLineIcon";
import ListUnorderedIcon from "remixicon-react/ListUnorderedIcon";
import ListCheck2Icon from "remixicon-react/ListCheck2Icon";
import DoubleQuotesLIcon from "remixicon-react/DoubleQuotesLIcon";
import LinkIcon from "remixicon-react/LinkMIcon";
import Focus3LineIcon from "remixicon-react/Focus3LineIcon";
import Search2LineIcon from "remixicon-react/Search2LineIcon";

// Languages
import css from "highlight.js/lib/languages/css";
import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import html from "highlight.js/lib/languages/xml";

lowlight.registerLanguage("html", html);
lowlight.registerLanguage("css", css);
lowlight.registerLanguage("js", js);
lowlight.registerLanguage("ts", ts);

const extensions = [
  CodeBlockLowlight.extend({
    addNodeView() {
      return ReactNodeViewRenderer(CodeBlockComponent);
    },
  }).configure({ lowlight }),
  Document,
  NoteLabel,
  Text,
  StarterKit,
  Link,
  Mathblock,
  Highlight,
  Underline,
  Placeholder,
  OrderedList,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Image.configure({}),
];

type Props = {
  note: Note;
  onCloseEditor: () => void;
  onChange: (content: JSONContent, title?: string) => void;
  isFullScreen?: boolean;
  title: string;
  onTitleChange: (newTitle: string) => void;
};

function NoteEditor({
  note,
  onChange,
  onCloseEditor,
  onTitleChange,
  isFullScreen = false,
}: Props) {
  const [localTitle, setLocalTitle] = useState<string>(note.title);

  const handleTitleChange = (event: React.ChangeEvent<HTMLDivElement>) => {
    const newTitle = event.currentTarget.innerHTML;
    console.log("New Title:", newTitle);
    setLocalTitle(newTitle);
    onTitleChange(newTitle);
    onChange(editor?.getJSON() || ({} as JSONContent), newTitle);
  };

  useEffect(() => {
    // Update local title when the note changes
    setLocalTitle(note.title);
  }, [note.title]);

  const editor = useEditor(
    {
      extensions,
      content: note.content,
      editorProps: {
        attributes: {
          class: "overflow-auto outline-none",
        },
      },
      onUpdate: ({ editor }) => {
        const editorContent = editor.getJSON();
        onChange(editorContent);
      },
    },
    [note.id]
  );

  const [focusMode, setFocusMode] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(true);

  async function handleImageUpload(file: File, noteId: string) {
    try {
      // Construct the directory path
      const directoryPath = `/assets/${noteId}`;

      // Ensure the directory exists using Capacitor Filesystem
      await Filesystem.mkdir({
        path: directoryPath,
        directory: FilesystemDirectory.Data,
        recursive: true, // Create directories recursively
      });

      const imageFileName = `${directoryPath}/${file.name}`;

      // Read the file as a data URL
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const imageDataUrl = reader.result as string;

        // Save the image using Capacitor Filesystem
        await Filesystem.writeFile({
          path: imageFileName,
          data: imageDataUrl.split(",")[1], // Extract base64 data
          directory: FilesystemDirectory.Data,
        });

        // Construct the image source URL
        const imageSrc = imageDataUrl;

        // Insert the image into the editor
        editor?.chain().focus().setImage({ src: imageSrc }).run();
      };
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  }

  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;

    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) {
            await handleImageUpload(file, note.id);
          }
        }
      }
    }
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();

    const files = event.dataTransfer?.files;

    if (files && files.length > 0) {
      await handleImageUpload(files[0], note.id);
    }
  };

  const toggleBold = () => {
    editor?.chain().focus().toggleBold().run();
  };

  const toggleItalic = () => {
    editor?.chain().focus().toggleItalic().run();
  };

  const toggleUnderline = () => {
    editor?.chain().focus().toggleUnderline().run();
  };

  const toggleStrike = () => {
    editor?.chain().focus().toggleStrike().run();
  };

  const toggleHighlight = () => {
    editor?.chain().focus().toggleHighlight().run();
  };

  const toggleOrderedList = () => {
    editor?.chain().focus().toggleOrderedList().run();
  };

  const toggleUnorderedList = () => {
    editor?.chain().focus().toggleBulletList().run();
  };

  const toggleTaskList = () => {
    editor?.chain().focus().toggleTaskList().run();
  };

  const toggleBlockquote = () => {
    editor?.chain().focus().toggleBlockquote().run();
  };

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();

      return;
    }

    // update link
    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  const handleHeadingClick = (heading: string) => {
    console.log("Heading clicked:", heading);
  };

  const [headingTreeVisible, setHeadingTreeVisible] = useState(false);

  const toggleHeadingTree = () => {
    setHeadingTreeVisible(!headingTreeVisible);
  };

  const headingTreeRef = useRef<HTMLDivElement | null>(null);

  // Close heading tree when clicking outside
  const handleOutsideClick = useCallback(
    (event: MouseEvent) => {
      if (
        headingTreeVisible &&
        headingTreeRef.current &&
        event.target instanceof Node &&
        !headingTreeRef.current.contains(event.target)
      ) {
        setHeadingTreeVisible(false);
      }
    },
    [headingTreeVisible]
  );

  useEffect(() => {
    // Attach the event listener
    document.addEventListener("mousedown", handleOutsideClick);

    // Detach the event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [handleOutsideClick]);

  return (
    <div
      className="overflow-auto h-full justify-center items-start px-4 text-black dark:text-white lg:px-60 text-base "
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {toolbarVisible && (
        <div
          className={
            isFullScreen
              ? "overflow-auto w-full"
              : "fixed z-10 pt-2 inset-x-2 bottom-6 overflow-auto h-auto w-full bg-transparent md:sticky md:top-0 md:z-50 no-scrollbar"
          }
        >
          <div className="bottom-6 flex overflow-y-hidden w-fit md:p-2 md:w-full p-4 bg-[#2D2C2C] rounded-full">
            <button
              className="p-2 hidden sm:block sm:align-start rounded-md text-white bg-transparent cursor-pointer"
              onClick={onCloseEditor}
            >
              <ArrowLeftSLineIcon className="border-none text-white text-xl w-7 h-7" />
            </button>
            <div className="sm:mx-auto flex overflow-y-hidden w-fit">
              <button
                className={
                  editor?.isActive("bold")
                    ? "p-2 rounded-md text-amber-400 bg-[#353333] cursor-pointer"
                    : "p-2 rounded-md text-white bg-transparent cursor-pointer"
                }
                onClick={toggleBold}
              >
                <BoldIcon className="border-none text-white text-xl w-7 h-7" />
              </button>
              <button
                className={
                  editor?.isActive("italic")
                    ? "p-2 rounded-md text-amber-400 bg-[#353333] cursor-pointer"
                    : "p-2 rounded-md text-white bg-transparent cursor-pointer"
                }
                onClick={toggleItalic}
              >
                <ItalicIcon className="border-none text-white text-xl w-7 h-7" />
              </button>
              <button
                className={
                  editor?.isActive("underline")
                    ? "p-2 rounded-md text-amber-400 bg-[#353333] cursor-pointer"
                    : "p-2 rounded-md text-white bg-transparent cursor-pointer"
                }
                onClick={toggleUnderline}
              >
                <UnderlineIcon className="border-none text-white text-xl w-7 h-7" />
              </button>
              <button
                className={
                  editor?.isActive("strike")
                    ? "p-2 rounded-md text-amber-400 bg-[#353333] cursor-pointer"
                    : "p-2 rounded-md text-white bg-transparent cursor-pointer"
                }
                onClick={toggleStrike}
              >
                <StrikethroughIcon className="border-none text-white text-xl w-7 h-7" />
              </button>
              <button
                className={
                  editor?.isActive("highlight")
                    ? "p-2 rounded-md text-amber-400 bg-[#353333] cursor-pointer"
                    : "p-2 rounded-md text-white bg-transparent cursor-pointer"
                }
                onClick={toggleHighlight}
              >
                <MarkPenLineIcon className="border-none text-white text-xl w-7 h-7" />
              </button>

              <button
                className={
                  editor?.isActive("OrderedList")
                    ? "p-2 rounded-md text-amber-400 bg-[#353333] cursor-pointer"
                    : "p-2 rounded-md text-white bg-transparent cursor-pointer"
                }
                onClick={toggleOrderedList}
              >
                <ListOrderedIcon className="border-none text-white text-xl w-7 h-7" />
              </button>
              <button
                className={
                  editor?.isActive("UnorderedList")
                    ? "p-2 rounded-md text-amber-400 bg-[#353333] cursor-pointer"
                    : "p-2 rounded-md text-white bg-transparent cursor-pointer"
                }
                onClick={toggleUnorderedList}
              >
                <ListUnorderedIcon className="border-none text-white text-xl w-7 h-7" />
              </button>
              <button
                className={
                  editor?.isActive("Tasklist")
                    ? "p-2 rounded-md text-amber-400 bg-[#353333] cursor-pointer"
                    : "p-2 rounded-md text-white bg-transparent cursor-pointer"
                }
                onClick={toggleTaskList}
              >
                <ListCheck2Icon className="border-none text-white text-xl w-7 h-7" />
              </button>
              <button
                className={
                  editor?.isActive("Blockquote")
                    ? "p-2 rounded-md text-amber-400 bg-[#353333] cursor-pointer"
                    : "p-2 rounded-md text-white bg-transparent cursor-pointer"
                }
                onClick={toggleBlockquote}
              >
                <DoubleQuotesLIcon className="border-none text-white text-xl w-7 h-7" />
              </button>

              <button
                onClick={setLink}
                className={
                  "p-2 rounded-md text-white bg-transparent cursor-pointer"
                }
              >
                <LinkIcon className="border-none text-white text-xl w-7 h-7" />
              </button>
              <div className="p-2 rounded-md text-white bg-transparent cursor-pointer">
                <label htmlFor="image-upload-input">
                  <ImageLineIcon className="border-none text-white text-xl w-7 h-7 cursor-pointer" />
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleImageUpload(e.target.files[0], note.id);
                    }
                  }}
                  id="image-upload-input"
                  className="hidden"
                />
              </div>
            </div>
            <button
              className="p-2 hidden sm:block sm:align-end rounded-md text-white bg-transparent cursor-pointer"
              onClick={toggleHeadingTree}
            >
              <Search2LineIcon className="border-none text-white text-xl w-7 h-7" />
            </button>
          </div>
        </div>
      )}

      {headingTreeVisible && editor && (
        <div
          ref={headingTreeRef}
          className={`transition-opacity z-50 ${
            headingTreeVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <HeadingTree onHeadingClick={handleHeadingClick} />
        </div>
      )}
      <div className="sm:hidden bg-white dark:bg-[#232222] pr-4 pl-4 pt-5 pb-2 fixed top-0 inset-x-0 overflow-auto h-auto w-full bg-transparent z-50 no-scrollbar flex justify-between">
  <button
    className="p-2 mt-4 align-start rounded-md text-white bg-transparent cursor-pointer"
    onClick={onCloseEditor}
  >
    <ArrowLeftSLineIcon className="border-none dark:text-white text-neutral-800 text-xl w-7 h-7" />
  </button>
  <div className="flex">
    <button
      className="p-2  mt-4 rounded-md text-white bg-transparent cursor-pointer"
      onClick={() => {
        setFocusMode((prevFocusMode) => !prevFocusMode);
        setToolbarVisible((prevToolbarVisible) => !prevToolbarVisible);
      }}
    >
      <Focus3LineIcon
        className={`border-none ${
          focusMode ? "text-amber-400" : "text-neutral-800"
        }  dark:text-white text-xl w-7 h-7`}
      />
    </button>
    <button
      className="p-2 align-end mt-4 rounded-md text-white bg-transparent cursor-pointer"
      onClick={toggleHeadingTree}
    >
      <Search2LineIcon
        className={`border-none ${
          focusMode ? "hidden" : "block"
        }  dark:text-white text-neutral-800 text-xl w-7 h-7`}
      />
    </button>
  </div>
</div>

      <div
        contentEditable
        suppressContentEditableWarning
        className="text-3xl mt-[2em] font-bold overflow-y-scroll outline-none mt-4"
        onBlur={handleTitleChange}
        dangerouslySetInnerHTML={{ __html: localTitle }}
      />

      <div>
        <NoteLabels note={note} onChange={onChange} />
        <div className="py-2 h-full w-full" id="container">
          <EditorContent
            editor={editor}
            className="overflow-auto w-full mb-[6em] min-h-[25em]"
          />
        </div>
      </div>
    </div>
  );
}

export default NoteEditor;
