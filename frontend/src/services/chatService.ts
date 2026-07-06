export async function sendToBackend(text:string){

    const response = await fetch(
        "http://localhost:5000/api/chat",
        {

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                chatInput:text

            })

        }
    );

    return response.json();

}