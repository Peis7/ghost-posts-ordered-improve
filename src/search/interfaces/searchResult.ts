export enum GhostContentType{
    Post = 'Post',
    Page = 'Page',
}
export interface SearchResult{
    contentType: GhostContentType,
    title: string,
    url: string,
    mainTag?: string,
    weight?: Number,
}