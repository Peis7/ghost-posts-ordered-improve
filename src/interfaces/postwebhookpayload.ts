export interface PostWebhookPayload{
    body?: {
        post?: {
            current?: {
                id?: string,
                title?: string,
                tags?: Array<any>,
                slug?: string
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