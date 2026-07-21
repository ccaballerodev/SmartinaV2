export async function getDocuments() {

    const response = await fetch(
        "http://localhost:5000/api/documents"
    );

    if (!response.ok) {
        throw new Error("No se pudieron obtener los documentos");
    }

    return await response.json();
}