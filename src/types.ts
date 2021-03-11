import { Octokit } from "@octokit/core";
import * as OctokitTypes from "@octokit/types";

export {
  EndpointOptions,
  RequestInterface,
  OctokitResponse,
  RequestParameters,
  Route,
} from "@octokit/types";

export { PaginatingEndpoints } from "./generated/paginating-endpoints";

import { PaginatingEndpoints } from "./generated/paginating-endpoints";

// // https://stackoverflow.com/a/52991061/206879
// type RequiredKeys<T> = {
//   [K in keyof T]-?: string extends K
//     ? never
//     : number extends K
//     ? never
//     : {} extends Pick<T, K>
//     ? never
//     : K;
// } extends { [_ in keyof T]-?: infer U }
//   ? U extends keyof T
//     ? U
//     : never
//   : never;

// https://stackoverflow.com/a/58980331/206879
type KnownKeys<T> = Extract<
  {
    [K in keyof T]: string extends K ? never : number extends K ? never : K;
  } extends { [_ in keyof T]: infer U }
    ? U
    : never,
  keyof T
>;
type KeysMatching<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];
type KnownKeysMatching<T, V> = KeysMatching<Pick<T, KnownKeys<T>>, V>;

// For endpoints that respond with a namespaced response, we need to return the normalized
// response the same way we do via src/normalize-paginated-list-response
type GetResultsType<T> = T extends { data: any[] }
  ? T["data"]
  : T extends { data: object }
  ? T["data"][KnownKeysMatching<T["data"], any[]>]
  : never;

type NormalizeResponse<T> = T & { data: GetResultsType<T> };

type DataType<T> = "data" extends keyof T ? T["data"] : unknown;

export interface MapFunction<
  T = OctokitTypes.OctokitResponse<PaginationResults<unknown>>,
  R = unknown[]
> {
  (response: T, done: () => void): R;
}

export type PaginationResults<T = unknown> = T[];

interface Overloads<O extends [] | [Octokit]> {
  // Using object as first parameter

  /**
   * Paginate a request using endpoint options and map each response to a custom array
   *
   * @param {object} options Must set `method` and `url`. Plus URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   * @param {function} mapFn Optional method to map each response to a custom array
   */
  <T, R>(
    ...args: [
      ...octokit: O,
      options: OctokitTypes.EndpointOptions,
      mapFn: MapFunction<
        OctokitTypes.OctokitResponse<PaginationResults<T>>,
        R[]
      >
    ]
  ): Promise<PaginationResults<R>>;

  /**
   * Paginate a request using endpoint options
   *
   * @param {object} options Must set `method` and `url`. Plus URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  <T>(...args: [...octokit: O, options: OctokitTypes.EndpointOptions]): Promise<
    PaginationResults<T>
  >;

  // Using route string as first parameter

  /**
   * Paginate a request using a known endpoint route string and map each response to a custom array
   *
   * @param {string} route Request method + URL. Example: `'GET /orgs/{org}'`
   * @param {function} mapFn Optional method to map each response to a custom array
   */
  <R extends keyof PaginatingEndpoints, MR extends unknown[]>(
    ...args: [
      ...octokit: O,
      route: R,
      mapFn: MapFunction<PaginatingEndpoints[R]["response"], MR>
    ]
  ): Promise<MR>;

  /**
   * Paginate a request using a known endpoint route string and parameters, and map each response to a custom array
   *
   * @param {string} route Request method + URL. Example: `'GET /orgs/{org}'`
   * @param {object} parameters URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   * @param {function} mapFn Optional method to map each response to a custom array
   */
  <R extends keyof PaginatingEndpoints, MR extends unknown[]>(
    ...args: [
      ...octokit: O,
      route: R,
      parameters: PaginatingEndpoints[R]["parameters"],
      mapFn: MapFunction<PaginatingEndpoints[R]["response"], MR>
    ]
  ): Promise<MR>;

  /**
   * Paginate a request using an known endpoint route string
   *
   * @param {string} route Request method + URL. Example: `'GET /orgs/{org}'`
   * @param {object} parameters? URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  <R extends keyof PaginatingEndpoints>(
    ...args: [
      ...octokit: O,
      route: R,
      ...parameters: [PaginatingEndpoints[R]["parameters"]] | []
    ]
  ): Promise<DataType<PaginatingEndpoints[R]["response"]>>;

  // I tried this version which would make the `parameters` argument required if the route has required parameters
  // but it caused some weird errors
  // <R extends keyof PaginatingEndpoints>(
  //   route: R,
  //   ...args: RequiredKeys<PaginatingEndpoints[R]["parameters"]> extends never
  //     ? [PaginatingEndpoints[R]["parameters"]?]
  //     : [PaginatingEndpoints[R]["parameters"]]
  // ): Promise<DataType<PaginatingEndpoints[R]["response"]>>;

  /**
   * Paginate a request using an unknown endpoint route string
   *
   * @param {string} route Request method + URL. Example: `'GET /orgs/{org}'`
   * @param {object} parameters? URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  <T, R extends OctokitTypes.Route = OctokitTypes.Route>(
    ...args: [
      ...octokit: O,
      route: R,
      ...parameters:
        | [
            R extends keyof PaginatingEndpoints
              ? PaginatingEndpoints[R]["parameters"]
              : OctokitTypes.RequestParameters
          ]
        | []
    ]
  ): Promise<T[]>;

  //  Using request method as first parameter

  /**
   * Paginate a request using an endpoint method and a map function
   *
   * @param {string} request Request method (`octokit.request` or `@octokit/request`)
   * @param {function} mapFn? Optional method to map each response to a custom array
   */
  <R extends OctokitTypes.RequestInterface, MR extends unknown[]>(
    ...args: [
      ...octokit: O,
      request: R,
      mapFn: MapFunction<
        NormalizeResponse<OctokitTypes.GetResponseTypeFromEndpointMethod<R>>,
        MR
      >
    ]
  ): Promise<MR>;

  /**
   * Paginate a request using an endpoint method, parameters, and a map function
   *
   * @param {string} request Request method (`octokit.request` or `@octokit/request`)
   * @param {object} parameters URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   * @param {function} mapFn? Optional method to map each response to a custom array
   */
  <R extends OctokitTypes.RequestInterface, MR extends unknown[]>(
    ...args: [
      ...octokit: O,
      request: R,
      parameters: Parameters<R>[0],
      mapFn: MapFunction<
        NormalizeResponse<OctokitTypes.GetResponseTypeFromEndpointMethod<R>>,
        MR
      >
    ]
  ): Promise<MR>;

  /**
   * Paginate a request using an endpoint method and parameters
   *
   * @param {string} request Request method (`octokit.request` or `@octokit/request`)
   * @param {object} parameters? URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  <R extends OctokitTypes.RequestInterface>(
    ...args: [...octokit: O, request: R, ...parameters: [Parameters<R>[0]] | []]
  ): Promise<
    NormalizeResponse<OctokitTypes.GetResponseTypeFromEndpointMethod<R>>["data"]
  >;

  iterator: {
    // Using object as first parameter

    /**
     * Get an async iterator to paginate a request using endpoint options
     *
     * @see {link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of} for await...of
     * @param {object} options Must set `method` and `url`. Plus URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
     */
    <T>(
      ...args: [...octokit: O, options: OctokitTypes.EndpointOptions]
    ): AsyncIterableIterator<
      OctokitTypes.OctokitResponse<PaginationResults<T>>
    >;

    // Using route string as first parameter

    /**
     * Get an async iterator to paginate a request using a known endpoint route string and optional parameters
     *
     * @see {link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of} for await...of
     * @param {string} route Request method + URL. Example: `'GET /orgs/{org}'`
     * @param {object} [parameters] URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
     */
    <R extends keyof PaginatingEndpoints>(
      ...args: [
        ...octokit: O,
        route: R,
        ...parameters: [PaginatingEndpoints[R]["parameters"]] | []
      ]
    ): AsyncIterableIterator<
      OctokitTypes.OctokitResponse<DataType<PaginatingEndpoints[R]["response"]>>
    >;

    /**
     * Get an async iterator to paginate a request using an unknown endpoint route string and optional parameters
     *
     * @see {link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of} for await...of
     * @param {string} route Request method + URL. Example: `'GET /orgs/{org}'`
     * @param {object} [parameters] URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
     */
    <T, R extends OctokitTypes.Route = OctokitTypes.Route>(
      ...args: [
        ...octokit: O,
        route: R,
        ...parameters:
          | [
              R extends keyof PaginatingEndpoints
                ? PaginatingEndpoints[R]["parameters"]
                : OctokitTypes.RequestParameters
            ]
          | []
      ]
    ): AsyncIterableIterator<
      OctokitTypes.OctokitResponse<PaginationResults<T>>
    >;

    // Using request method as first parameter

    /**
     * Get an async iterator to paginate a request using a request method and optional parameters
     *
     * @see {link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of} for await...of
     * @param {string} request `@octokit/request` or `octokit.request` method
     * @param {object} [parameters] URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
     */
    <R extends OctokitTypes.RequestInterface>(
      ...args: [...octokit: O, route: R, ...parameters: [Parameters<R>[0]] | []]
    ): AsyncIterableIterator<
      NormalizeResponse<OctokitTypes.GetResponseTypeFromEndpointMethod<R>>
    >;
  };
}

export type PaginateInterface = Overloads<[]>;
export type ComposePaginateInterface = Overloads<[Octokit]>;
