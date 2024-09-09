export interface PostWebhookPayload{
    body?: {
        post?: {
            current?: {
                id?: string,
                title?: string,
                tags?: Array<any>,
                slug?: string,
                url?: string,
                excerpt?: string,
                mainTag?: string
            },
            previous?: {
                id?: string,
                title?: string,
                tags?: Array<any>,
                slug?: string
            }
        }
    }
}