export const getMimeType = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
        case "png":
            return "image/png";
        case "jpg":
        case "jpeg":
            return "image/jpeg";
        case "gif":
            return "image/gif";
        case "bmp":
            return "image/bmp";
        case "webp":
            return "image/webp";
        case "tiff":
        case "tif":
            return "image/tiff";
        case "svg":
            return "image/svg+xml";
        case "pdf":
            return "application/pdf";
        case "doc":
        case "docx":
            return "application/msword";
        case "xls":
        case "xlsx":
            return "application/vnd.ms-excel";
        case "ppt":
        case "pptx":
            return "application/vnd.ms-powerpoint";
        case "txt":
            return "text/plain";
        case "csv":
            return "text/csv";
        case "html":
        case "htm":
            return "text/html";
        case "xml":
            return "text/xml";
        case "json":
            return "application/json";
        case "mp3":
            return "audio/mpeg";
        case "ogg":
            return "audio/ogg";
        case "wav":
            return "audio/wav";
        case "mp4":
            return "video/mp4";
        case "avi":
            return "video/x-msvideo";
        case "mpeg":
            return "video/mpeg";
        case "mov":
            return "video/quicktime";
        case "zip":
            return "application/zip";
        case "rar":
            return "application/x-rar-compressed";
        case "7z":
            return "application/x-7z-compressed";
        case "tar":
            return "application/x-tar";
        case "gz":
            return "application/gzip";
        case "bz2":
            return "application/x-bzip2";
        case "exe":
            return "application/octet-stream";
        case "apk":
            return "application/vnd.android.package-archive";
        case "deb":
            return "application/x-deb";
        case "dmg":
            return "application/x-apple-diskimage";
        case "iso":
            return "application/x-iso9660-image";
        case "rpm":
            return "application/x-rpm";
        case "woff":
            return "application/font-woff";
        case "woff2":
            return "application/font-woff2";
        case "ttf":
            return "font/ttf";
        case "otf":
            return "font/otf";
        case "ics":
            return "text/calendar";
        case "vcf":
            return "text/vcard";
        case "psd":
            return "image/vnd.adobe.photoshop";
        case "ai":
            return "application/postscript";
        case "eps":
            return "application/postscript";
        case "midi":
            return "audio/midi";
        case "3gp":
            return "video/3gpp";
        case "wmv":
            return "video/x-ms-wmv";
        case "flv":
            return "video/x-flv";
        case "aac":
            return "audio/aac";
        case "flac":
            return "audio/flac";
        case "webm":
            return "video/webm";
        case "mkv":
            return "video/x-matroska";
        case "m4a":
            return "audio/mp4";
        case "m4v":
            return "video/x-m4v";
        case "ogg":
            return "audio/ogg";
        case "ogv":
            return "video/ogg";
        case "oga":
            return "audio/ogg";
        case "weba":
            return "audio/webm";
        case "odt":
            return "application/vnd.oasis.opendocument.text";
        case "ods":
            return "application/vnd.oasis.opendocument.spreadsheet";
        case "odp":
            return "application/vnd.oasis.opendocument.presentation";
        case "odg":
            return "application/vnd.oasis.opendocument.graphics";
        case "odc":
            return "application/vnd.oasis.opendocument.chart";
        case "odb":
            return "application/vnd.oasis.opendocument.database";
        case "odf":
            return "application/vnd.oasis.opendocument.formula";
        case "otc":
            return "application/vnd.oasis.opendocument.chart-template";
        case "oti":
            return "application/vnd.oasis.opendocument.image-template";
        case "odm":
            return "application/vnd.oasis.opendocument.text-master";
        case "ott":
            return "application/vnd.oasis.opendocument.text-template";
        case "oth":
            return "application/vnd.oasis.opendocument.text-web";
        case "djvu":
            return "image/vnd.djvu";
        case "xps":
            return "application/oxps";
        case "rtf":
            return "application/rtf";
        case "epub":
            return "application/epub+zip";
        case "mobi":
            return "application/x-mobipocket-ebook";
        case "jar":
            return "application/java-archive";
        case "war":
            return "application/java-archive";
        case "ear":
            return "application/java-archive";
        case "ico":
            return "image/x-icon";
        case "cfg":
            return "text/plain";
        case "log":
            return "text/plain";
        case "md":
            return "text/markdown";
        case "sql":
            return "application/sql";
        case "yaml":
            return "application/x-yaml";
        case "bat":
            return "application/bat";
        case "cmd":
            return "application/cmd";
        case "ps1":
            return "application/ps1";
        case "sh":
            return "application/sh";
        case "bashrc":
            return "application/bashrc";
        case "info":
            return "text/plain";
        case "license":
            return "text/plain";
        case "sha1":
            return "text/plain";
        case "sha256":
            return "text/plain";
        case "ds_store":
            return "application/x-apple-ds-store";
        case "dll":
            return "application/octet-stream";
        case "tsv":
            return "text/tab-separated-values";
        case "ini":
            return "text/plain";
        case "bat":
            return "application/octet-stream";
        case "cmd":
            return "application/octet-stream";
        case "ps1":
            return "application/octet-stream";
        case "sh":
            return "application/octet-stream";
        case "cfg":
            return "text/plain";
        case "ds_store":
            return "application/octet-stream";
        case "dll":
            return "application/octet-stream";
        case "csv":
            return "text/csv";
        case "tsv":
            return "text/tab-separated-values";
        case "sql":
            return "application/sql";
        case "yaml":
            return "application/x-yaml";
        case "log":
            return "text/plain";
        case "bat":
            return "application/octet-stream";
        case "cmd":
            return "application/octet-stream";
        case "ps1":
            return "application/octet-stream";
        case "sh":
            return "application/octet-stream";
        case "md5":
            return "text/plain";
        default:
            return "application/octet-stream"; // Default to binary if type is unknown
    }
};

export default getMimeType;