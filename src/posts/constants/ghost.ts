import { ArrayOfStringPairs } from "../../types/custom";
import { LANG } from "../enums/langs";

export const FIELDS =  ['id','title','url','slug','featured','published_at', 'excerpt'];
export const INCLUDE =  ['tags'];
export const BASE_FILTER: ArrayOfStringPairs = [['visibility','public']];
    
export const INDEX_TAG_FORMAT = 'index-'; //index-{number}
export const LEVEL_TAG_FORMAT = 'level-'; //level-{number}
export const NO_MENU_TAG = 'no_menu'; //level-{number}
export const LANG_TAG_FORMAT = 'hash-lang-'; //index-{number}
export const DIFFICULTY_LEVEL_TAG_FORMAT = 'diff-level-'; //diff-level-{begginer/intermediate/advance}
export const MAIN_LANG = LANG.English;

export const AVAILABLE_LANGS =  [LANG.English, LANG.Spanish];