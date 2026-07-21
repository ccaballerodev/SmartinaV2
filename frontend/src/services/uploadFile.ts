export async function uploadFile(file: File) {

    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch(
        "http://localhost:5000/api/upload",
        {
            method: "POST",
            body: formData
        }
    );

    if (!response.ok) {
        throw new Error("No se pudo subir el archivo");
    }

    return await response.json();
}