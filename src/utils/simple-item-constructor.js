export async function textItemConstructor(inputData){
    let requestReply = {
        type: inputData.type_reply
    };
    let requestData = {
        context: inputData.context? { message_id: inputData.message_id} : undefined,
        text: {
            preview_url: inputData.preview? inputData.preview : false,
            body: inputData.body
        }
    };
    return {
        requestData,
        requestReply
    };
}

export async function reactionItemConstructor(inputData){
    let requestReply = {
        type: inputData.type_reply
    };
    let requestData = {
        reaction: {
            message_id: inputData.message_id,
            emoji: inputData.emoji
        }
    };
    return {
        requestData,
        requestReply
    };
}
