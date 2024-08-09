export interface PostWebhookPayload{
    body?: {
        post?: {
            current?: {
                id?: string,
                tags?: Array<any>,
                slug?: string
            },
            previous?: {
                id?: string,
                tags?: Array<any>,
                slug?: string
            }
        }
    }
}