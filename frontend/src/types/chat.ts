export interface Message {
    role: "user" | "model";
    text: string;
    timestamp?: number;
}

export interface ChatState {

    messages: Message[];

    isListening:boolean;

    inputText:string;

    isLoading:boolean;

    ttsEnabled:boolean;

}