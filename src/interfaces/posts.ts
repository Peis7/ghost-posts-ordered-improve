export interface Posts{
    id?: string,
    title?: string,
    tags?: 
        { name?: string }[],
    url?: String,
    excerpt?: string,
    slug?: string,
    featured?: Boolean,
    published_at?: Date,
    langURLs?: Array<string>,
}