import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { uploadFile } from "../../services/uploadFile";
import { getDocuments } from "../../services/getDocuments";
import { deleteDocument } from "../../services/deleteDocument";
import "./Archivos.css";

type UploadedFile = {
  id: number;
  name: string;
  size: number;
  type: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string): string {
  if (type.startsWith("image/")) return "🖼️";
  if (type.startsWith("video/")) return "🎬";
  if (type.startsWith("audio/")) return "🎵";
  if (type.includes("pdf")) return "📕";
  if (type.includes("word") || type.includes("document")) return "📘";
  if (type.includes("sheet") || type.includes("excel")) return "📗";
  if (type.includes("zip") || type.includes("compressed")) return "🗜️";
  return "📄";
}

export default function Archivos() {

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {

    try {

      const docs = await getDocuments();

      setFiles(
        docs.map((doc: any) => ({
          id: doc.id,
          name: doc.original_name,
          size: Number(doc.file_size),
          type: doc.mime_type,
        }))
      );

    } catch (error) {

      console.error("Error cargando documentos", error);

    }

  };

  const addFiles = async (list: FileList | null) => {

    if (!list) return;

    for (const file of Array.from(list)) {

      try {

        await uploadFile(file);

      } catch (error) {

        console.error(error);

        alert(`Error subiendo ${file.name}`);

      }

    }

    await loadDocuments();

  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {

    addFiles(e.target.files);

    e.target.value = "";

  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {

    e.preventDefault();

    setDragging(false);

    addFiles(e.dataTransfer.files);

  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {

    e.preventDefault();

    setDragging(true);

  };

  const removeFile = async (id: number) => {

      const confirmar = window.confirm(
          "¿Deseas eliminar este documento?"
      );

      if (!confirmar) {
          return;
      }

      try {

          await deleteDocument(id);

          setFiles(prev =>
              prev.filter(file => file.id !== id)
          );

      } catch (error) {

          console.error(error);

          alert("No se pudo eliminar el documento.");

      }

  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (

    <div className="archivos">

      <div className="archivos-head">

        <h2 className="archivos-title">
          Gestor de archivos
        </h2>

        <p className="archivos-subtitle">
          Sube, visualiza y elimina los documentos de tu asistente.
        </p>

      </div>

      <div
        className={"dropzone" + (dragging ? " dragging" : "")}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setDragging(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {

          if (e.key === "Enter" || e.key === " ") {

            inputRef.current?.click();

          }

        }}
      >

        <div className="dropzone-icon">
          ⬆️
        </div>

        <p className="dropzone-title">
          Arrastra y suelta tus archivos aquí
        </p>

        <p className="dropzone-sub">
          o haz clic para seleccionarlos
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={onInputChange}
        />

      </div>

      <div className="archivos-meta">

        <span>

          {files.length} archivo{files.length !== 1 && "s"}

        </span>

        <span>

          {formatSize(totalSize)} en total

        </span>

      </div>

      {

        files.length === 0 ? (

          <div className="archivos-empty">

            <div className="archivos-empty-icon">
              📂
            </div>

            <p>
              Aún no hay archivos subidos.
            </p>

          </div>

        ) : (

          <ul className="file-list">

            {

              files.map(file => (

                <li
                  className="file-item"
                  key={file.id}
                >

                  <div className="file-thumb">

                    <span className="file-emoji">

                      {fileIcon(file.type)}

                    </span>

                  </div>

                  <div className="file-info">

                    <span
                      className="file-name"
                      title={file.name}
                    >

                      {file.name}

                    </span>

                    <span className="file-detail">

                      {formatSize(file.size)} · {file.type}

                    </span>

                  </div>

                  <button
                    className="file-delete"
                    onClick={() => removeFile(file.id)}
                    title="Eliminar"
                  >

                    ✕

                  </button>

                </li>

              ))

            }

          </ul>

        )

      }

    </div>

  );

}