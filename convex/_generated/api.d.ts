/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as chat from "../chat.js";
import type * as comments from "../comments.js";
import type * as http from "../http.js";
import type * as prompts from "../prompts.js";
import type * as regenerateSuggestions from "../regenerateSuggestions.js";
import type * as seed from "../seed.js";
import type * as seedDemoPrompts from "../seedDemoPrompts.js";
import type * as suggestions from "../suggestions.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  chat: typeof chat;
  comments: typeof comments;
  http: typeof http;
  prompts: typeof prompts;
  regenerateSuggestions: typeof regenerateSuggestions;
  seed: typeof seed;
  seedDemoPrompts: typeof seedDemoPrompts;
  suggestions: typeof suggestions;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
