export interface Message {
    role: "user" | "model";
    text: string;
}

export interface ChatState {

    messages: Message[];

    isListening:boolean;

    inputText:string;

    isLoading:boolean;

    ttsEnabled:boolean;

}