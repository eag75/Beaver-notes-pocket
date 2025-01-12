import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Note } from "../../store/types";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Transition,
} from "@headlessui/react";
import { getChangeLogs } from "../../store/notes";
import { EditorContent, useEditor, JSONContent } from "@tiptap/react";
import Toolbar from "./Toolbar";
import { isPlatform } from "@ionic/react";
import Drawer from "./Drawer";
import Find from "./Find";
import "../../assets/css/editor.css";
import extensions from "../../lib/tiptap/index";
import EditorSuggestion from "../../lib/tiptap/exts/suggestions/EditorSuggestion";
import NoteLinkExtension from "../../lib/tiptap/exts/suggestions/NoteLinkSuggestion";
import NoteLabelSuggestion from "../../lib/tiptap/exts/suggestions/NoteLabelSuggestion";
import DOMPurify from "dompurify";
import useNoteEditor from "../../store/useNoteActions";
import { useNotesState } from "../../store/Activenote";
import Icons from "../../lib/remixicon-react";
import Mousetrap from "mousetrap";
import getMimeType from "../../utils/mimetype";
import { saveImageToFileSystem } from "../../utils/fileHandler";
import { saveFileToFileSystem } from "../../utils/fileHandler";
import { useSyncDav } from "../../utils/Webdav/webDavUtil";
import { WebviewPrint } from "capacitor-webview-print";
import { shareNote } from "../../utils/share";

type Props = {
  note: Note;
  notesState: Record<string, Note>;
  setNotesState: (notes: Record<string, Note>) => void;
};

function EditorComponent({ note, notesState, setNotesState }: Props) {
  const { activeNoteId, setActiveNoteId } = useNotesState();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const findRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { title, handleChangeNoteContent } = useNoteEditor(
    activeNoteId,
    notesState,
    setNotesState
  );
  const [previousContent, setPreviousContent] = useState<JSONContent | null>(
    null
  );
  const { syncDav } = useSyncDav();
  const [searchQuery] = useState<string>("");
  const [filteredNotes, setFilteredNotes] =
    useState<Record<string, Note>>(notesState);
  const [sortingOption] = useState("updatedAt");

  useEffect(() => {
    const filtered = Object.values(notesState).filter((note) => {
      const titleMatch = note.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return titleMatch;
    });

    setFilteredNotes(
      Object.fromEntries(filtered.map((note) => [note.id, note]))
    );
  }, [searchQuery, notesState]);

  const notesList = Object.values(filteredNotes).sort((a, b) => {
    switch (sortingOption) {
      case "alphabetical":
        return a.title.localeCompare(b.title);
      case "createdAt":
        const createdAtA = typeof a.createdAt === "number" ? a.createdAt : 0;
        const createdAtB = typeof b.createdAt === "number" ? b.createdAt : 0;
        return createdAtA - createdAtB;
      case "updatedAt":
      default:
        const updatedAtA = typeof a.updatedAt === "number" ? a.updatedAt : 0;
        const updatedAtB = typeof b.updatedAt === "number" ? b.updatedAt : 0;
        return updatedAtA - updatedAtB;
    }
  });

  // Function to handle opening the dialog
  const openDialog = () => {
    setIsOpen(true);
  };

  // Function to handle closing the dialog
  const closeDialog = () => {
    setIsOpen(false);
  };

  const [focusMode, setFocusMode] = useState(false);
  const [showFind, setShowFind] = useState(false);
  const [wd, setWd] = useState<boolean>(
    localStorage.getItem("expand-editor") === "true"
  );
  const navigate = useNavigate();

  const titleRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setActiveNoteId(note.id);
  }, [note.id, setActiveNoteId]);

  const uniqueLabels = Array.from(
    new Set(Object.values(notesState).flatMap((note) => note.labels))
  );

  document.addEventListener("updateLabel", (event: Event) => {
    const customEvent = event as CustomEvent;
    const labelToAdd = customEvent.detail.props;

    // Ensure existingLabels is initialized correctly
    const existingLabels = note.labels || [];

    // Check if the label already exists
    const labelExists = existingLabels.includes(labelToAdd);

    // Only add the label if it doesn't already exist
    const updatedLabels = labelExists
      ? existingLabels
      : [...existingLabels, labelToAdd];

    const jsonContent = editor?.getJSON() || {};

    // Update the note content with the new list of labels
    handleChangeNoteContent(jsonContent, note.title, updatedLabels);
  });

  const exts = [
    ...extensions,
    NoteLinkExtension.configure({
      notes: notesList,
    }),
    NoteLabelSuggestion.configure({
      uniqueLabels: uniqueLabels,
    }),
    EditorSuggestion.configure({
      noteId: note.id,
    }),
  ];

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Function to handle typing detection with throttling
  const handleTyping = useCallback(() => {
    // Reset the timeout if the user starts typing again within the limit
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set the user as currently typing
    if (!isTyping) {
      setIsTyping(true);
    }

    // Start a new timeout to detect when typing has stopped
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false);

      const showLogs = async () => {
        const logs = await getChangeLogs();
        console.log(logs);
      };

      showLogs();

      alert("User has stopped typing. Files fetched.");
    }, 4000); // Adjust timeout limit as needed
  }, [isTyping]);

  const editor = useEditor(
    {
      extensions: exts,
      content: note.content,
      onUpdate: ({ editor }) => {
        const editorContent = editor.getJSON();

        // Handle note content change
        handleChangeNoteContent(editorContent || {}, title);

        // Trigger typing detection
        handleTyping();

        // Compare previous and current content
        if (previousContent) {
          const previousLabels = findNoteLabels(previousContent);
          const currentLabels = findNoteLabels(editorContent);

          // Check for deleted labels
          previousLabels.forEach((label) => {
            if (
              !currentLabels.some(
                (currentLabel) => currentLabel.attrs.id === label.attrs.id
              )
            ) {
              console.log(`Label deleted: ${label.attrs.label}`);

              // Remove the deleted label from the labels array
              const updatedLabels = note.labels.filter(
                (noteLabel) => noteLabel !== label.attrs.label
              );

              // Update the note content with the new labels
              handleChangeNoteContent(editorContent, note.title, updatedLabels);
            }
          });
        }

        // Update previous content
        setPreviousContent(editorContent);
      },
    },
    [note.id]
  );

  useEffect(() => {
    if (editor) {
      editor.commands.focus();
      editorRef.current = editor; // Store editor in ref
    }
  }, [editor]);

  document.addEventListener("showFind", () => {
    setShowFind((prevShowFind) => !prevShowFind);
  });

  useEffect(() => {
    setWd(localStorage.getItem("expand-editor") === "true");
  }, []);

  const handleTitleChange = (event: React.ChangeEvent<HTMLDivElement>) => {
    const newTitle = DOMPurify.sanitize(event.currentTarget.innerHTML);
    handleChangeNoteContent(editor?.getJSON() || {}, newTitle);
  };

  const handleTitlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  // Utility function to find all noteLabel objects in the JSON content
  const findNoteLabels = (content: JSONContent) => {
    const labels: any[] = [];
    const traverse = (node: any) => {
      if (node.type === "noteLabel") {
        labels.push(node);
      }
      if (node.content) {
        node.content.forEach(traverse);
      }
    };
    traverse(content);
    return labels;
  };

  const handleKeyDownTitle = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      editorRef.current?.commands.focus(); // Focus the editor
    }
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

  useEffect(() => {
    Mousetrap.bind("mod+f", (e) => {
      e.preventDefault();
      setShowFind(true);
    });
    // Mousetrap key bindings
    Mousetrap.bind("mod+k", (e) => {
      e.preventDefault();
      setLink();
    });
    Mousetrap.bind("mod+shift+x", (e) => {
      e.preventDefault();
      editor?.chain().focus().toggleStrike().run();
    });
    Mousetrap.bind("mod+shift+h", (e) => {
      e.preventDefault();
      editor
        ?.chain()
        .focus()
        .setHighlight({ color: "bg-yellow-200 dark:bg-yellow-100" })
        .run();
    });
    Mousetrap.bind("mod+.", (e) => {
      e.preventDefault();
      editor?.commands.toggleSuperscript();
    });
    Mousetrap.bind("alt+,", (e) => {
      e.preventDefault();
      editor?.commands.toggleSubscript();
    });
    Mousetrap.bind("mod+e", (e) => {
      e.preventDefault();
      editor?.chain().focus().toggleCode().run();
    });
    Mousetrap.bind("alt+1", (e) => {
      e.preventDefault();
      editor?.chain().focus().toggleHeading({ level: 1 }).run();
    });
    Mousetrap.bind("alt+2", (e) => {
      e.preventDefault();
      editor?.chain().focus().toggleHeading({ level: 2 }).run();
    });
    Mousetrap.bind("alt+3", (e) => {
      e.preventDefault();
      editor?.chain().focus().toggleHeading({ level: 3 }).run();
    });
    Mousetrap.bind("alt+4", (e) => {
      e.preventDefault();
      editor?.chain().focus().toggleHeading({ level: 4 }).run();
    });
    Mousetrap.bind("alt+5", (e) => {
      e.preventDefault();
      editor?.chain().focus().toggleHeading({ level: 5 }).run();
    });
    Mousetrap.bind("alt+6", (e) => {
      e.preventDefault();
      editor?.chain().focus().toggleHeading({ level: 6 }).run();
    });
    Mousetrap.bind("mod+shift+7", (e) => {
      e.preventDefault();
      editor?.chain().focus().toggleOrderedList().run();
    });
    Mousetrap.bind("mod+shift+8", (e) => {
      e.preventDefault();
      editor?.chain().focus().toggleBulletList().run();
    });
    Mousetrap.bind("mod+shift+b", (e) => {
      e.preventDefault();
      editor?.chain().focus().toggleBlockquote().run();
    });
    Mousetrap.bind("mod+alt+c", (e) => {
      e.preventDefault();
      editor?.chain().focus().toggleCodeBlock().run();
    });

    // Cleanup all key bindings on unmount
    return () => {
      Mousetrap.unbind("mod+k");
      Mousetrap.unbind("mod+shift+x");
      Mousetrap.unbind("mod+shift+h");
      Mousetrap.unbind("mod+.");
      Mousetrap.unbind("alt+,");
      Mousetrap.unbind("mod+e");
      Mousetrap.unbind("alt+1");
      Mousetrap.unbind("alt+2");
      Mousetrap.unbind("alt+3");
      Mousetrap.unbind("alt+4");
      Mousetrap.unbind("alt+5");
      Mousetrap.unbind("alt+6");
      Mousetrap.unbind("mod+shift+7");
      Mousetrap.unbind("mod+shift+8");
      Mousetrap.unbind("mod+shift+b");
      Mousetrap.unbind("mod+alt+c");
    };
  }, [editor, setLink]);

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const items = event.dataTransfer.items;
    await processItems(items);
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const items = event.clipboardData.items;
    document.execCommand("insertText", false, " "); // Add space before pasting

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.kind === "file") {
        // Handle pasted file (like from file manager)
        const file = item.getAsFile();
        if (file) {
          await handleFileByType(file); // Handle file processing as usual
        }
      } else if (item.kind === "string" && item.type === "text/html") {
        // Handle HTML content (like pasting from a web page)
        item.getAsString(async (htmlContent: string) => {
          const imageUrl = extractImageUrlFromHtml(htmlContent);
          if (imageUrl) {
            editor?.chain().setImage({ src: imageUrl }).run(); // Insert image from URL
          } else {
            // If no image URL, fallback to pasting the content as plain HTML/text
            editor?.chain().insertContent(htmlContent).run();
          }
        });
      } else if (item.kind === "string" && item.type === "text/plain") {
        // Handle plain text or URLs
        item.getAsString(async (textContent: string) => {
          if (isBase64Image(textContent)) {
            // If the content is a base64 image, insert it directly
            editor?.chain().setImage({ src: textContent }).run();
          } else if (isValidUrl(textContent)) {
            // If it's a valid URL, check if it's an image URL
            if (isImageUrl(textContent)) {
              editor?.chain().setImage({ src: textContent }).run(); // Insert image
            } else {
              // If it's not an image URL, insert it as plain text or link
              editor?.chain().insertContent(textContent).run();
            }
          } else {
            // If neither base64 nor a valid URL, insert it as plain text
            editor?.chain().insertContent(textContent).run();
          }
        });
      }
    }
  };

  // Helper to check if the pasted content is a base64 image
  const isBase64Image = (str: string): boolean => {
    return str.startsWith("data:image/") && str.includes("base64,");
  };

  // Helper to extract image URL from pasted HTML content
  const extractImageUrlFromHtml = (htmlContent: string): string | null => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const imgTag = tempDiv.querySelector("img");

    return imgTag ? imgTag.src : null;
  };

  // Helper to validate if a string is a valid URL
  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Helper to check if a URL is an image URL (jpg, png, gif, etc.)
  const isImageUrl = (url: string): boolean => {
    const imagePattern = /\.(jpeg|jpg|gif|png|bmp|webp)$/i;
    return imagePattern.test(url);
  };

  const processItems = async (items: DataTransferItemList) => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          const fileType = getMimeType(file.name);
          if (fileType) {
            await handleFileByType(file);
          } else {
            console.warn(`Unsupported file type: ${file.type}`);
          }
        }
      }
    }
  };

  const handleFileByType = async (file: File) => {
    try {
      let fileUrl = "",
        fileName = "";
      const mimeType = file.type;

      if (mimeType.startsWith("image/")) {
        const { imageUrl } = await saveImageToFileSystem(file, note.id);
        editor?.chain().setImage({ src: imageUrl }).run();
      } else if (mimeType.startsWith("video/")) {
        ({ fileUrl, fileName } = await saveFileToFileSystem(file, note.id));
        //@ts-ignore
        editor?.chain().setVideo({ src: fileUrl }).run();
      } else if (mimeType.startsWith("audio/")) {
        ({ fileUrl, fileName } = await saveFileToFileSystem(file, note.id));
        //@ts-ignore
        editor?.chain().setAudio({ src: fileUrl }).run();
      } else {
        ({ fileUrl, fileName } = await saveFileToFileSystem(file, note.id));
        //@ts-ignore
        editor?.chain().setFileEmbed(fileUrl, fileName).run();
      }
    } catch (error) {
      console.error(`Error handling file: ${file.name}`, error);
    }
  };

  const handlePrint = async (fileName: string) => {
    const html = document.documentElement;
    const darkModeActive = html.classList.contains("dark");

    // Temporarily force light mode by removing the "dark" class
    if (darkModeActive) html.classList.remove("dark");

    const restoreClass = () => {
      if (darkModeActive) html.classList.add("dark");
      window.removeEventListener("afterprint", restoreClass); // Clean up listener
    };

    // Restore dark mode after printing is done
    window.addEventListener("afterprint", restoreClass);

    try {
      await WebviewPrint.print({ name: fileName });
      console.log("Print triggered for file:", fileName);
    } catch (error) {
      console.error("Error printing webview:", error);
      restoreClass(); // Restore immediately on error
    }
  };

  const goBack = () => {
    const syncValue = localStorage.getItem("sync");

    try {
      if (syncValue === "dropbox") {
        const dropboxExport = new CustomEvent("dropboxExport");
        document.dispatchEvent(dropboxExport);
      } else if (syncValue === "webdav") {
        syncDav();
      } else if (syncValue === "iCloud") {
        const iCloudExport = new CustomEvent("iCloudExport");
        document.dispatchEvent(iCloudExport);
      } else if (syncValue === "googledrive") {
        const driveExport = new CustomEvent("driveExport");
        document.dispatchEvent(driveExport);
      } else if (syncValue === "onedrive") {
        const onedriveExport = new CustomEvent("onedriveExport");
        document.dispatchEvent(onedriveExport);
      }
    } catch (error) {
      console.error("An error occurred during export:", error);
    } finally {
      navigate("/"); // Always navigate back, even if an error occurs
    }
  };

  function toggleFocusMode() {
    try {
      if (!focusMode) {
        // Enable focus mode
        editor?.setOptions({ editable: false });
        editor?.view.update(editor.view.props);
        setFocusMode(true);
      } else {
        // Disable focus mode
        editor?.setOptions({ editable: true });
        editor?.view.update(editor.view.props);
        setFocusMode(false);
      }
    } catch (error) {
      // Log the error with a message
      console.error("Error while toggling focus mode:", error);
    }
  }

  return (
    <div>
      <div
        className={`editor overflow-auto h-full justify-center items-start px-4 ${
          wd ? "sm:px-10 md:px-10 lg:px-30" : "sm:px-10 md:px-20 lg:px-60"
        } text-black dark:text-[color:var(--selected-dark-text)]`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <Toolbar note={note} noteId={note.id} editor={editor} />
        <div
          className={`sm:hidden bg-white bg-opacity-95 dark:bg-[#232222] fixed inset-x-0 overflow-auto h-auto w-full z-40 no-scrollbar flex justify-between print:hidden`}
        >
          <button
            className="p-2 align-start rounded-md text-white bg-transparent cursor-pointer"
            onClick={goBack}
          >
            <Icons.ArrowLeftLineIcon className="border-none dark:text-[color:var(--selected-dark-text)] text-neutral-800 text-xl w-7 h-7" />
          </button>

          <div className="flex">
            <button
              aria-label="Open dialog"
              className="p-2 rounded-md text-white bg-transparent cursor-pointer"
              onClick={openDialog}
            >
              <Icons.ShareLineIcon
                className={`border-none text-neutral-800 dark:text-[color:var(--selected-dark-text)] text-xl w-7 h-7`}
              />
            </button>

            <Transition show={isOpen} as={React.Fragment}>
              <Dialog
                as="div"
                className="fixed inset-0 z-[1000] flex justify-center items-end print:hidden"
                onClose={closeDialog}
              >
                <DialogBackdrop className="fixed inset-0 bg-neutral-300 dark:bg-neutral-800 bg-opacity-75 dark:bg-opacity-75 transition-opacity" />
                <div className="fixed inset-0 flex items-end justify-end">
                  {" "}
                  <Transition.Child
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-full"
                    enterTo="opacity-100 translate-y-0"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-full"
                  >
                    <DialogPanel className="bg-white dark:bg-[#2D2C2C] p-6 rounded-2xl w-full mx-4 mb-8">
                      <div className="flex justify-between items-center dark:bg-[#2D2C2C] px-2">
                        <DialogTitle as="h2" className="text-xl font-semibold">
                          Export As
                        </DialogTitle>
                        <button
                          onClick={closeDialog}
                          className="text-white dark:text-[color:var(--selected-dark-text)] bg-neutral-300 dark:bg-neutral-700 rounded-full hover:text-neutral-100 focus:outline-none"
                        >
                          <Icons.CloseLineIcon />
                        </button>
                      </div>
                      <div className="p-1 border-b dark:border-neutral-500"></div>
                      <div className="mt-4 space-y-2 p-2 bg-[#F8F8F7] dark:bg-neutral-800 rounded-xl">
                        {/* Button for File Text */}
                        <div className="flex items-center w-full">
                          <button
                            className="w-full bg-[#F8F8F7] dark:bg-neutral-800 p-2 text-xl rounded-xl inline-flex justify-between items-center"
                            aria-label="BEA"
                            onClick={() => shareNote(note.id, notesState)}
                          >
                            <p className="text-base pl-2 py-1 font-bold">BEA</p>
                            <Icons.FileTextLineIcon
                              className="w-8 h-8"
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                        {/* Button for File PDF */}
                        <div className="flex items-center w-full">
                          <button
                            className="w-full bg-[#F8F8F7] dark:bg-neutral-800 p-2 text-xl rounded-xl inline-flex justify-between items-center"
                            onClick={() => handlePrint(`${note.title}.pdf`)}
                            aria-label="PDF"
                          >
                            <p className="text-base pl-2 py-1 font-bold">PDF</p>
                            <Icons.FileArticleLine
                              className="w-8 h-8"
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </div>
                    </DialogPanel>
                  </Transition.Child>
                </div>
              </Dialog>
            </Transition>

            <button
              className="p-2 rounded-md text-white bg-transparent cursor-pointer"
              onClick={toggleFocusMode}
            >
              <Icons.FileArticleLine
                className={`border-none ${
                  focusMode
                    ? "text-amber-400"
                    : "text-neutral-800 dark:text-[color:var(--selected-dark-text)]"
                }  text-xl w-7 h-7`}
              />
            </button>

            <button
              className="p-2 align-end rounded-md text-white bg-transparent cursor-pointer"
              onClick={() => {
                if (buttonRef.current) {
                  setShowFind(true);
                }
              }}
              ref={buttonRef}
            >
              <Icons.Search2LineIcon
                className={`border-none ${
                  focusMode ? "hidden" : "block"
                } dark:text-[color:var(--selected-dark-text)] text-neutral-800 text-xl w-7 h-7`}
              />
            </button>
          </div>
          {/* Portal appears below the button */}
          {showFind && (
            <div
              ref={findRef}
              className={`fixed ${showFind ? "block" : "hidden"}`}
              style={{
                zIndex: 80,
              }}
            >
              <div className="fixed inset-x-0 flex justify-center">
                <div className="w-full bg-white dark:bg-[#232222] px-4 sm:px-10 md:px-20 lg:px-60">
                  <Find editor={editor} setShowFind={setShowFind} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div id="content">
          <div
            contentEditable
            onPaste={handleTitlePaste}
            suppressContentEditableWarning
            onTouchStart={event?.preventDefault}
            className={`text-3xl font-bold overflow-y-scroll outline-none ${
              isPlatform("android") ? "mt-10 sm:pt-14" : "md:pt-14"
            } ${isPlatform("ios") ? "mt-10 sm:pt-14" : "md:pt-14"}`}
            onBlur={handleTitleChange}
            onKeyDown={handleKeyDownTitle} // Add onKeyDown to handle Enter key
            dangerouslySetInnerHTML={{ __html: note.title }}
            ref={titleRef} // Attach ref to title field
          />
          <div>
            <div className="py-2 h-full w-full" id="container">
              <EditorContent
                onPaste={handlePaste}
                editor={editor}
                onTouchStart={event?.preventDefault}
                className="prose dark:text-neutral-100 max-w-none prose-indigo mb-12"
              />
            </div>
          </div>
        </div>

        <div
          className={`${focusMode ? "hidden" : "block"} sm:hidden print:hidden`}
        >
          <Drawer noteId={note.id} note={note} editor={editor} />
        </div>
      </div>
    </div>
  );
}

export default EditorComponent;
