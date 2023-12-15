import { useCallback } from "react";
import { Note } from "./types";
import {lowlight} from 'lowlight'
import {
  EditorContent,
  useEditor,
  JSONContent,
  generateText,
} from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Placeholder from "@tiptap/extension-placeholder";
import { ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import styles from "./NoteEditor.module.css";
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Highlight from "@tiptap/extension-highlight";
import Heading from "@tiptap/extension-heading";
import Paragraph from "@tiptap/extension-paragraph";
import Underline from "@tiptap/extension-underline";
import Code from "@tiptap/extension-code";
import OrderedList from "@tiptap/extension-list-item";
import { ListItem } from "@tiptap/extension-list-item";
import CodeBlock from "@tiptap/extension-code-block";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Blockquote from "@tiptap/extension-blockquote";
import Link from "@tiptap/extension-link";
import Text from "@tiptap/extension-text";
import { NoteLabel } from './lib/tiptap/NoteLabel';
import Mathblock from './lib/tiptap/math-block/Index';
import {
  Filesystem,
  Directory,
  FilesystemEncoding,
} from "@capacitor/filesystem";
import CodeBlockComponent from './components/CodeBlockComponent';

// Remix Icons

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
import LinkIcon from "remixicon-react/LinkIcon";

// Languages
import css from 'highlight.js/lib/languages/css'
import js from 'highlight.js/lib/languages/javascript'
import ts from 'highlight.js/lib/languages/typescript'
import html from 'highlight.js/lib/languages/xml'

lowlight.registerLanguage('html', html)
lowlight.registerLanguage('css', css)
lowlight.registerLanguage('js', js)
lowlight.registerLanguage('ts', ts)


const extensions = [
  CodeBlockLowlight
        .extend({
          addNodeView() {
            return ReactNodeViewRenderer(CodeBlockComponent)
          },
        })
        .configure({ lowlight }),
  Document,
  NoteLabel,
  Text,
  StarterKit,
  Link,
  Mathblock,
  Highlight,
  Underline,
  Heading.configure({
    levels: [1, 2, 3, 4, 5, 6],
  }),
  Paragraph,
  CodeBlock,
  Code,
   Placeholder.configure({
    placeholder: 'Write something',
  }),
  OrderedList,
  ListItem,
  Blockquote,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Image.configure({}),
];


type Props = {
  note: Note;
  onChange: (content: JSONContent, title?: string) => void;
  isFullScreen?: boolean; // Add the isFullScreen prop
};

function NoteEditor({ note, onChange, isFullScreen = false }: Props) {
  const editor = useEditor(
    {
      extensions,
      content: note.content,
      editorProps: {
        attributes: {
          class: styles.TextEditor,
        },
      },
      onUpdate: ({ editor }) => {
        const editorContent = editor.getJSON();
        const firstNodeContent = editorContent.content?.[0];
        onChange(
          editorContent,
          firstNodeContent && generateText(firstNodeContent, extensions)
        );
      },
    },
    [note.id]
  );

  const handleImageUpload = async (file: File) => {
    try {
      // Generate a unique file name for the image (you can customize this)
      const imageName = `image_${Date.now()}.jpg`;

      // Directory name for your images
      const imagesDirectory = "images";

      // Check if the directory exists (or attempt to create it)
      try {
        await Filesystem.mkdir({
          path: imagesDirectory,
          directory: Directory.Data,
          recursive: true, // Create parent directories if they don't exist
        });
      } catch (createDirectoryError) {
        // Directory likely already exists, ignore the error
      }

      // Fetch the image as a binary blob
      const response = await fetch(URL.createObjectURL(file));
      const blob = await response.blob();

      // Convert the binary blob to an ArrayBuffer
      const arrayBuffer = await new Response(blob).arrayBuffer();

      // Convert ArrayBuffer to Uint8Array
      const uint8Array = new Uint8Array(arrayBuffer);

      // Convert the Uint8Array to a regular array of numbers
      const dataArray = Array.from(uint8Array);

      // Encode the array of numbers as Base64
      const base64Data = btoa(
        dataArray.map((byte) => String.fromCharCode(byte)).join("")
      );

      // Write the Base64 image data to the app's data directory
      await Filesystem.writeFile({
        path: `${imagesDirectory}/${imageName}`,
        data: base64Data,
        directory: Directory.Data,
        encoding: FilesystemEncoding.UTF8,
      });

      const imageSrc = `data:image/jpeg;base64,${base64Data}`;

      // Insert the image into the editor
      editor?.chain().focus().setImage({ src: imageSrc }).run();
    } catch (error) {
      console.error("Error uploading image:", error);
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

  return (
    <div className={styles.pageContainer}>
      <div
        className={
          isFullScreen ? styles.fullScreenEditor : styles.toolbarContainer
        }
      >
        <div className={styles.toolbarContainer}>
          <div className={styles.toolbar}>
            <a
              className={styles.toolbarButton}
              href="/"
            >
              <ArrowLeftSLineIcon className={styles.toolbarIcon} />
            </a>
            <button
              className={
                editor?.isActive("bold")
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
              onClick={toggleBold}
            >
              <BoldIcon className={styles.toolbarIcon} />
            </button>
            <button
              className={
                editor?.isActive("italic")
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
              onClick={toggleItalic}
            >
              <ItalicIcon className={styles.toolbarIcon} />
            </button>
            <button
              className={
                editor?.isActive("underline")
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
              onClick={toggleUnderline}
            >
              <UnderlineIcon className={styles.toolbarIcon} />
            </button>
            <button
              className={
                editor?.isActive("strike")
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
              onClick={toggleStrike}
            >
              <StrikethroughIcon className={styles.toolbarIcon} />
            </button>
            <button
              className={
                editor?.isActive("highlight")
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
              onClick={toggleHighlight}
            >
              <MarkPenLineIcon className={styles.toolbarIcon} />
            </button>
            
            <button
              className={
                editor?.isActive("OrderedList")
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
              onClick={toggleOrderedList}
            >
              <ListOrderedIcon className={styles.toolbarIcon} />
            </button>
            <button
              className={
                editor?.isActive("UnorderedList")
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
              onClick={toggleUnorderedList}
            >
              <ListUnorderedIcon className={styles.toolbarIcon} />
            </button>
            <button
              className={
                editor?.isActive("Tasklist")
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
              onClick={toggleTaskList}
            >
              <ListCheck2Icon className={styles.toolbarIcon} />
            </button>
            <button
              className={
                editor?.isActive("Blockquote")
                  ? styles.toolbarButtonActive
                  : styles.toolbarButton
              }
              onClick={toggleBlockquote}
            >
              <DoubleQuotesLIcon className={styles.toolbarIcon} />
            </button>
            
            <button
              onClick={setLink}
              className={editor?.isActive("link") ? "is-active" : ""}
            >
              <LinkIcon className={styles.toolbarIcon} />
            </button>
            <button
              className={styles.toolbarButton}
              onClick={() => {
                const imageInput =
                  document.getElementById("image-upload-input");
                if (imageInput) {
                  imageInput.click();
                }
              }}
            >
              {/* Add an icon for image upload button */}
              <ImageLineIcon className={styles.toolbarIcon} />
            </button>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files) {
                  handleImageUpload(e.target.files[0]);
                }
              }}
              style={{ display: "none" }}
              id="image-upload-input" // Add this ID
            />
          </div>
        </div>
      </div>
      <div className={styles.edtiorContainer}>
      <EditorContent editor={editor} className={styles.textEditorContent} />
      </div>
    </div>
  );
}

export default NoteEditor;
