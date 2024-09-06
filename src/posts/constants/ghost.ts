import { ArrayOfStringPairs } from "../../types/custom";

export const FIELDS =  ['id','title','url','slug','featured','published_at', 'excerpt'];
export const INCLUDE =  ['tags'];
export const BASE_FILTER: ArrayOfStringPairs = [['visibility','public']];
    
export const INDEX_TAG_FORMAT = 'index-'; //index-{number}
export const LEVEL_TAG_FORMAT = 'level-'; //level-{number}
export const NO_MENU_TAG = 'no_menu'; //level-{number}
export const LANG_TAG_FORMAT = 'hash-lang-'; //index-{number}