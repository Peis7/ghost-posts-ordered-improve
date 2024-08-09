export interface PostWebhookPayload{
    body?: {
        post?: {
            current?: {
                tags?: Array<any>,
                slug?: string
            },
            previous?: {
                tags?: Array<any>,
                slug?: string
            }
        }
    }
}