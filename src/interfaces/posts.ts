export interface Posts{
    id?: string,
    title?: string,
    tags?: [
        { name?: string }
    ],
    url?: String,
    slug?: string,
    featured?: Boolean,
    published_at: Date,
}