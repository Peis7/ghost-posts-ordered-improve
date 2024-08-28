enum ContentType{
    Post,
    Page
}
export interface SearchResult{
    contentType: ContentType,
    name: string,
    url: string,
    mainTag?: string,
}