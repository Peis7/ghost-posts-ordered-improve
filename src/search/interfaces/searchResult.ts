export enum GhostContentType{
    Post = 'Post',
    Page = 'Page',
    Article = 'Article'
}
export interface SearchResult{
    contentType: GhostContentType,
    title: string,
    url: string,
    mainTag?: string,
    weight?: Number,
    difficultyLevel?: string,
}