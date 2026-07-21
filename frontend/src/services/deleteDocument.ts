export async function deleteDocument(documentId: number) {

    const response = await fetch(
        `http://localhost:5000/api/documents/${documentId}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {
        throw new Error("No se pudo eliminar el documento");
    }

    return await response.json();

}