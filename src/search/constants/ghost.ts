import { ArrayOfStringPairs } from "../../types/custom";

export const FIELDS =  ['id','title','url','slug','featured','published_at'];
export const INCLUDE =  ['tags'];
export const BASE_FILTER: ArrayOfStringPairs = [['visibility','public']];