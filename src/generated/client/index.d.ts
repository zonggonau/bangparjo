
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model StoreSetting
 * 
 */
export type StoreSetting = $Result.DefaultSelection<Prisma.$StoreSettingPayload>
/**
 * Model MarginTier
 * 
 */
export type MarginTier = $Result.DefaultSelection<Prisma.$MarginTierPayload>
/**
 * Model Order
 * 
 */
export type Order = $Result.DefaultSelection<Prisma.$OrderPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more StoreSettings
 * const storeSettings = await prisma.storeSetting.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more StoreSettings
   * const storeSettings = await prisma.storeSetting.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.storeSetting`: Exposes CRUD operations for the **StoreSetting** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more StoreSettings
    * const storeSettings = await prisma.storeSetting.findMany()
    * ```
    */
  get storeSetting(): Prisma.StoreSettingDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.marginTier`: Exposes CRUD operations for the **MarginTier** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MarginTiers
    * const marginTiers = await prisma.marginTier.findMany()
    * ```
    */
  get marginTier(): Prisma.MarginTierDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.order`: Exposes CRUD operations for the **Order** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Orders
    * const orders = await prisma.order.findMany()
    * ```
    */
  get order(): Prisma.OrderDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.8.0
   * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    StoreSetting: 'StoreSetting',
    MarginTier: 'MarginTier',
    Order: 'Order'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "storeSetting" | "marginTier" | "order"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      StoreSetting: {
        payload: Prisma.$StoreSettingPayload<ExtArgs>
        fields: Prisma.StoreSettingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StoreSettingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreSettingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StoreSettingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreSettingPayload>
          }
          findFirst: {
            args: Prisma.StoreSettingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreSettingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StoreSettingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreSettingPayload>
          }
          findMany: {
            args: Prisma.StoreSettingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreSettingPayload>[]
          }
          create: {
            args: Prisma.StoreSettingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreSettingPayload>
          }
          createMany: {
            args: Prisma.StoreSettingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StoreSettingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreSettingPayload>[]
          }
          delete: {
            args: Prisma.StoreSettingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreSettingPayload>
          }
          update: {
            args: Prisma.StoreSettingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreSettingPayload>
          }
          deleteMany: {
            args: Prisma.StoreSettingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StoreSettingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.StoreSettingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreSettingPayload>[]
          }
          upsert: {
            args: Prisma.StoreSettingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StoreSettingPayload>
          }
          aggregate: {
            args: Prisma.StoreSettingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStoreSetting>
          }
          groupBy: {
            args: Prisma.StoreSettingGroupByArgs<ExtArgs>
            result: $Utils.Optional<StoreSettingGroupByOutputType>[]
          }
          count: {
            args: Prisma.StoreSettingCountArgs<ExtArgs>
            result: $Utils.Optional<StoreSettingCountAggregateOutputType> | number
          }
        }
      }
      MarginTier: {
        payload: Prisma.$MarginTierPayload<ExtArgs>
        fields: Prisma.MarginTierFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MarginTierFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarginTierPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MarginTierFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarginTierPayload>
          }
          findFirst: {
            args: Prisma.MarginTierFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarginTierPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MarginTierFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarginTierPayload>
          }
          findMany: {
            args: Prisma.MarginTierFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarginTierPayload>[]
          }
          create: {
            args: Prisma.MarginTierCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarginTierPayload>
          }
          createMany: {
            args: Prisma.MarginTierCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MarginTierCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarginTierPayload>[]
          }
          delete: {
            args: Prisma.MarginTierDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarginTierPayload>
          }
          update: {
            args: Prisma.MarginTierUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarginTierPayload>
          }
          deleteMany: {
            args: Prisma.MarginTierDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MarginTierUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MarginTierUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarginTierPayload>[]
          }
          upsert: {
            args: Prisma.MarginTierUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarginTierPayload>
          }
          aggregate: {
            args: Prisma.MarginTierAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMarginTier>
          }
          groupBy: {
            args: Prisma.MarginTierGroupByArgs<ExtArgs>
            result: $Utils.Optional<MarginTierGroupByOutputType>[]
          }
          count: {
            args: Prisma.MarginTierCountArgs<ExtArgs>
            result: $Utils.Optional<MarginTierCountAggregateOutputType> | number
          }
        }
      }
      Order: {
        payload: Prisma.$OrderPayload<ExtArgs>
        fields: Prisma.OrderFieldRefs
        operations: {
          findUnique: {
            args: Prisma.OrderFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.OrderFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          findFirst: {
            args: Prisma.OrderFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.OrderFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          findMany: {
            args: Prisma.OrderFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>[]
          }
          create: {
            args: Prisma.OrderCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          createMany: {
            args: Prisma.OrderCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.OrderCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>[]
          }
          delete: {
            args: Prisma.OrderDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          update: {
            args: Prisma.OrderUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          deleteMany: {
            args: Prisma.OrderDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.OrderUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.OrderUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>[]
          }
          upsert: {
            args: Prisma.OrderUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          aggregate: {
            args: Prisma.OrderAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOrder>
          }
          groupBy: {
            args: Prisma.OrderGroupByArgs<ExtArgs>
            result: $Utils.Optional<OrderGroupByOutputType>[]
          }
          count: {
            args: Prisma.OrderCountArgs<ExtArgs>
            result: $Utils.Optional<OrderCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    storeSetting?: StoreSettingOmit
    marginTier?: MarginTierOmit
    order?: OrderOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model StoreSetting
   */

  export type AggregateStoreSetting = {
    _count: StoreSettingCountAggregateOutputType | null
    _min: StoreSettingMinAggregateOutputType | null
    _max: StoreSettingMaxAggregateOutputType | null
  }

  export type StoreSettingMinAggregateOutputType = {
    key: string | null
    value: string | null
  }

  export type StoreSettingMaxAggregateOutputType = {
    key: string | null
    value: string | null
  }

  export type StoreSettingCountAggregateOutputType = {
    key: number
    value: number
    _all: number
  }


  export type StoreSettingMinAggregateInputType = {
    key?: true
    value?: true
  }

  export type StoreSettingMaxAggregateInputType = {
    key?: true
    value?: true
  }

  export type StoreSettingCountAggregateInputType = {
    key?: true
    value?: true
    _all?: true
  }

  export type StoreSettingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StoreSetting to aggregate.
     */
    where?: StoreSettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoreSettings to fetch.
     */
    orderBy?: StoreSettingOrderByWithRelationInput | StoreSettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StoreSettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoreSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoreSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned StoreSettings
    **/
    _count?: true | StoreSettingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StoreSettingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StoreSettingMaxAggregateInputType
  }

  export type GetStoreSettingAggregateType<T extends StoreSettingAggregateArgs> = {
        [P in keyof T & keyof AggregateStoreSetting]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStoreSetting[P]>
      : GetScalarType<T[P], AggregateStoreSetting[P]>
  }




  export type StoreSettingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StoreSettingWhereInput
    orderBy?: StoreSettingOrderByWithAggregationInput | StoreSettingOrderByWithAggregationInput[]
    by: StoreSettingScalarFieldEnum[] | StoreSettingScalarFieldEnum
    having?: StoreSettingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StoreSettingCountAggregateInputType | true
    _min?: StoreSettingMinAggregateInputType
    _max?: StoreSettingMaxAggregateInputType
  }

  export type StoreSettingGroupByOutputType = {
    key: string
    value: string
    _count: StoreSettingCountAggregateOutputType | null
    _min: StoreSettingMinAggregateOutputType | null
    _max: StoreSettingMaxAggregateOutputType | null
  }

  type GetStoreSettingGroupByPayload<T extends StoreSettingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StoreSettingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StoreSettingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StoreSettingGroupByOutputType[P]>
            : GetScalarType<T[P], StoreSettingGroupByOutputType[P]>
        }
      >
    >


  export type StoreSettingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    key?: boolean
    value?: boolean
  }, ExtArgs["result"]["storeSetting"]>

  export type StoreSettingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    key?: boolean
    value?: boolean
  }, ExtArgs["result"]["storeSetting"]>

  export type StoreSettingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    key?: boolean
    value?: boolean
  }, ExtArgs["result"]["storeSetting"]>

  export type StoreSettingSelectScalar = {
    key?: boolean
    value?: boolean
  }

  export type StoreSettingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"key" | "value", ExtArgs["result"]["storeSetting"]>

  export type $StoreSettingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "StoreSetting"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      key: string
      value: string
    }, ExtArgs["result"]["storeSetting"]>
    composites: {}
  }

  type StoreSettingGetPayload<S extends boolean | null | undefined | StoreSettingDefaultArgs> = $Result.GetResult<Prisma.$StoreSettingPayload, S>

  type StoreSettingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<StoreSettingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: StoreSettingCountAggregateInputType | true
    }

  export interface StoreSettingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['StoreSetting'], meta: { name: 'StoreSetting' } }
    /**
     * Find zero or one StoreSetting that matches the filter.
     * @param {StoreSettingFindUniqueArgs} args - Arguments to find a StoreSetting
     * @example
     * // Get one StoreSetting
     * const storeSetting = await prisma.storeSetting.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StoreSettingFindUniqueArgs>(args: SelectSubset<T, StoreSettingFindUniqueArgs<ExtArgs>>): Prisma__StoreSettingClient<$Result.GetResult<Prisma.$StoreSettingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one StoreSetting that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {StoreSettingFindUniqueOrThrowArgs} args - Arguments to find a StoreSetting
     * @example
     * // Get one StoreSetting
     * const storeSetting = await prisma.storeSetting.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StoreSettingFindUniqueOrThrowArgs>(args: SelectSubset<T, StoreSettingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StoreSettingClient<$Result.GetResult<Prisma.$StoreSettingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first StoreSetting that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoreSettingFindFirstArgs} args - Arguments to find a StoreSetting
     * @example
     * // Get one StoreSetting
     * const storeSetting = await prisma.storeSetting.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StoreSettingFindFirstArgs>(args?: SelectSubset<T, StoreSettingFindFirstArgs<ExtArgs>>): Prisma__StoreSettingClient<$Result.GetResult<Prisma.$StoreSettingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first StoreSetting that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoreSettingFindFirstOrThrowArgs} args - Arguments to find a StoreSetting
     * @example
     * // Get one StoreSetting
     * const storeSetting = await prisma.storeSetting.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StoreSettingFindFirstOrThrowArgs>(args?: SelectSubset<T, StoreSettingFindFirstOrThrowArgs<ExtArgs>>): Prisma__StoreSettingClient<$Result.GetResult<Prisma.$StoreSettingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more StoreSettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoreSettingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all StoreSettings
     * const storeSettings = await prisma.storeSetting.findMany()
     * 
     * // Get first 10 StoreSettings
     * const storeSettings = await prisma.storeSetting.findMany({ take: 10 })
     * 
     * // Only select the `key`
     * const storeSettingWithKeyOnly = await prisma.storeSetting.findMany({ select: { key: true } })
     * 
     */
    findMany<T extends StoreSettingFindManyArgs>(args?: SelectSubset<T, StoreSettingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StoreSettingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a StoreSetting.
     * @param {StoreSettingCreateArgs} args - Arguments to create a StoreSetting.
     * @example
     * // Create one StoreSetting
     * const StoreSetting = await prisma.storeSetting.create({
     *   data: {
     *     // ... data to create a StoreSetting
     *   }
     * })
     * 
     */
    create<T extends StoreSettingCreateArgs>(args: SelectSubset<T, StoreSettingCreateArgs<ExtArgs>>): Prisma__StoreSettingClient<$Result.GetResult<Prisma.$StoreSettingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many StoreSettings.
     * @param {StoreSettingCreateManyArgs} args - Arguments to create many StoreSettings.
     * @example
     * // Create many StoreSettings
     * const storeSetting = await prisma.storeSetting.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StoreSettingCreateManyArgs>(args?: SelectSubset<T, StoreSettingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many StoreSettings and returns the data saved in the database.
     * @param {StoreSettingCreateManyAndReturnArgs} args - Arguments to create many StoreSettings.
     * @example
     * // Create many StoreSettings
     * const storeSetting = await prisma.storeSetting.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many StoreSettings and only return the `key`
     * const storeSettingWithKeyOnly = await prisma.storeSetting.createManyAndReturn({
     *   select: { key: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StoreSettingCreateManyAndReturnArgs>(args?: SelectSubset<T, StoreSettingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StoreSettingPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a StoreSetting.
     * @param {StoreSettingDeleteArgs} args - Arguments to delete one StoreSetting.
     * @example
     * // Delete one StoreSetting
     * const StoreSetting = await prisma.storeSetting.delete({
     *   where: {
     *     // ... filter to delete one StoreSetting
     *   }
     * })
     * 
     */
    delete<T extends StoreSettingDeleteArgs>(args: SelectSubset<T, StoreSettingDeleteArgs<ExtArgs>>): Prisma__StoreSettingClient<$Result.GetResult<Prisma.$StoreSettingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one StoreSetting.
     * @param {StoreSettingUpdateArgs} args - Arguments to update one StoreSetting.
     * @example
     * // Update one StoreSetting
     * const storeSetting = await prisma.storeSetting.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StoreSettingUpdateArgs>(args: SelectSubset<T, StoreSettingUpdateArgs<ExtArgs>>): Prisma__StoreSettingClient<$Result.GetResult<Prisma.$StoreSettingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more StoreSettings.
     * @param {StoreSettingDeleteManyArgs} args - Arguments to filter StoreSettings to delete.
     * @example
     * // Delete a few StoreSettings
     * const { count } = await prisma.storeSetting.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StoreSettingDeleteManyArgs>(args?: SelectSubset<T, StoreSettingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StoreSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoreSettingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many StoreSettings
     * const storeSetting = await prisma.storeSetting.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StoreSettingUpdateManyArgs>(args: SelectSubset<T, StoreSettingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StoreSettings and returns the data updated in the database.
     * @param {StoreSettingUpdateManyAndReturnArgs} args - Arguments to update many StoreSettings.
     * @example
     * // Update many StoreSettings
     * const storeSetting = await prisma.storeSetting.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more StoreSettings and only return the `key`
     * const storeSettingWithKeyOnly = await prisma.storeSetting.updateManyAndReturn({
     *   select: { key: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends StoreSettingUpdateManyAndReturnArgs>(args: SelectSubset<T, StoreSettingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StoreSettingPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one StoreSetting.
     * @param {StoreSettingUpsertArgs} args - Arguments to update or create a StoreSetting.
     * @example
     * // Update or create a StoreSetting
     * const storeSetting = await prisma.storeSetting.upsert({
     *   create: {
     *     // ... data to create a StoreSetting
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the StoreSetting we want to update
     *   }
     * })
     */
    upsert<T extends StoreSettingUpsertArgs>(args: SelectSubset<T, StoreSettingUpsertArgs<ExtArgs>>): Prisma__StoreSettingClient<$Result.GetResult<Prisma.$StoreSettingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of StoreSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoreSettingCountArgs} args - Arguments to filter StoreSettings to count.
     * @example
     * // Count the number of StoreSettings
     * const count = await prisma.storeSetting.count({
     *   where: {
     *     // ... the filter for the StoreSettings we want to count
     *   }
     * })
    **/
    count<T extends StoreSettingCountArgs>(
      args?: Subset<T, StoreSettingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StoreSettingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a StoreSetting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoreSettingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends StoreSettingAggregateArgs>(args: Subset<T, StoreSettingAggregateArgs>): Prisma.PrismaPromise<GetStoreSettingAggregateType<T>>

    /**
     * Group by StoreSetting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StoreSettingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends StoreSettingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StoreSettingGroupByArgs['orderBy'] }
        : { orderBy?: StoreSettingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, StoreSettingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStoreSettingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the StoreSetting model
   */
  readonly fields: StoreSettingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for StoreSetting.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StoreSettingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the StoreSetting model
   */
  interface StoreSettingFieldRefs {
    readonly key: FieldRef<"StoreSetting", 'String'>
    readonly value: FieldRef<"StoreSetting", 'String'>
  }
    

  // Custom InputTypes
  /**
   * StoreSetting findUnique
   */
  export type StoreSettingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreSetting
     */
    select?: StoreSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreSetting
     */
    omit?: StoreSettingOmit<ExtArgs> | null
    /**
     * Filter, which StoreSetting to fetch.
     */
    where: StoreSettingWhereUniqueInput
  }

  /**
   * StoreSetting findUniqueOrThrow
   */
  export type StoreSettingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreSetting
     */
    select?: StoreSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreSetting
     */
    omit?: StoreSettingOmit<ExtArgs> | null
    /**
     * Filter, which StoreSetting to fetch.
     */
    where: StoreSettingWhereUniqueInput
  }

  /**
   * StoreSetting findFirst
   */
  export type StoreSettingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreSetting
     */
    select?: StoreSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreSetting
     */
    omit?: StoreSettingOmit<ExtArgs> | null
    /**
     * Filter, which StoreSetting to fetch.
     */
    where?: StoreSettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoreSettings to fetch.
     */
    orderBy?: StoreSettingOrderByWithRelationInput | StoreSettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StoreSettings.
     */
    cursor?: StoreSettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoreSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoreSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StoreSettings.
     */
    distinct?: StoreSettingScalarFieldEnum | StoreSettingScalarFieldEnum[]
  }

  /**
   * StoreSetting findFirstOrThrow
   */
  export type StoreSettingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreSetting
     */
    select?: StoreSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreSetting
     */
    omit?: StoreSettingOmit<ExtArgs> | null
    /**
     * Filter, which StoreSetting to fetch.
     */
    where?: StoreSettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoreSettings to fetch.
     */
    orderBy?: StoreSettingOrderByWithRelationInput | StoreSettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StoreSettings.
     */
    cursor?: StoreSettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoreSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoreSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StoreSettings.
     */
    distinct?: StoreSettingScalarFieldEnum | StoreSettingScalarFieldEnum[]
  }

  /**
   * StoreSetting findMany
   */
  export type StoreSettingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreSetting
     */
    select?: StoreSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreSetting
     */
    omit?: StoreSettingOmit<ExtArgs> | null
    /**
     * Filter, which StoreSettings to fetch.
     */
    where?: StoreSettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StoreSettings to fetch.
     */
    orderBy?: StoreSettingOrderByWithRelationInput | StoreSettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing StoreSettings.
     */
    cursor?: StoreSettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StoreSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StoreSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StoreSettings.
     */
    distinct?: StoreSettingScalarFieldEnum | StoreSettingScalarFieldEnum[]
  }

  /**
   * StoreSetting create
   */
  export type StoreSettingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreSetting
     */
    select?: StoreSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreSetting
     */
    omit?: StoreSettingOmit<ExtArgs> | null
    /**
     * The data needed to create a StoreSetting.
     */
    data: XOR<StoreSettingCreateInput, StoreSettingUncheckedCreateInput>
  }

  /**
   * StoreSetting createMany
   */
  export type StoreSettingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many StoreSettings.
     */
    data: StoreSettingCreateManyInput | StoreSettingCreateManyInput[]
  }

  /**
   * StoreSetting createManyAndReturn
   */
  export type StoreSettingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreSetting
     */
    select?: StoreSettingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the StoreSetting
     */
    omit?: StoreSettingOmit<ExtArgs> | null
    /**
     * The data used to create many StoreSettings.
     */
    data: StoreSettingCreateManyInput | StoreSettingCreateManyInput[]
  }

  /**
   * StoreSetting update
   */
  export type StoreSettingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreSetting
     */
    select?: StoreSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreSetting
     */
    omit?: StoreSettingOmit<ExtArgs> | null
    /**
     * The data needed to update a StoreSetting.
     */
    data: XOR<StoreSettingUpdateInput, StoreSettingUncheckedUpdateInput>
    /**
     * Choose, which StoreSetting to update.
     */
    where: StoreSettingWhereUniqueInput
  }

  /**
   * StoreSetting updateMany
   */
  export type StoreSettingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update StoreSettings.
     */
    data: XOR<StoreSettingUpdateManyMutationInput, StoreSettingUncheckedUpdateManyInput>
    /**
     * Filter which StoreSettings to update
     */
    where?: StoreSettingWhereInput
    /**
     * Limit how many StoreSettings to update.
     */
    limit?: number
  }

  /**
   * StoreSetting updateManyAndReturn
   */
  export type StoreSettingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreSetting
     */
    select?: StoreSettingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the StoreSetting
     */
    omit?: StoreSettingOmit<ExtArgs> | null
    /**
     * The data used to update StoreSettings.
     */
    data: XOR<StoreSettingUpdateManyMutationInput, StoreSettingUncheckedUpdateManyInput>
    /**
     * Filter which StoreSettings to update
     */
    where?: StoreSettingWhereInput
    /**
     * Limit how many StoreSettings to update.
     */
    limit?: number
  }

  /**
   * StoreSetting upsert
   */
  export type StoreSettingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreSetting
     */
    select?: StoreSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreSetting
     */
    omit?: StoreSettingOmit<ExtArgs> | null
    /**
     * The filter to search for the StoreSetting to update in case it exists.
     */
    where: StoreSettingWhereUniqueInput
    /**
     * In case the StoreSetting found by the `where` argument doesn't exist, create a new StoreSetting with this data.
     */
    create: XOR<StoreSettingCreateInput, StoreSettingUncheckedCreateInput>
    /**
     * In case the StoreSetting was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StoreSettingUpdateInput, StoreSettingUncheckedUpdateInput>
  }

  /**
   * StoreSetting delete
   */
  export type StoreSettingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreSetting
     */
    select?: StoreSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreSetting
     */
    omit?: StoreSettingOmit<ExtArgs> | null
    /**
     * Filter which StoreSetting to delete.
     */
    where: StoreSettingWhereUniqueInput
  }

  /**
   * StoreSetting deleteMany
   */
  export type StoreSettingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StoreSettings to delete
     */
    where?: StoreSettingWhereInput
    /**
     * Limit how many StoreSettings to delete.
     */
    limit?: number
  }

  /**
   * StoreSetting without action
   */
  export type StoreSettingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StoreSetting
     */
    select?: StoreSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StoreSetting
     */
    omit?: StoreSettingOmit<ExtArgs> | null
  }


  /**
   * Model MarginTier
   */

  export type AggregateMarginTier = {
    _count: MarginTierCountAggregateOutputType | null
    _avg: MarginTierAvgAggregateOutputType | null
    _sum: MarginTierSumAggregateOutputType | null
    _min: MarginTierMinAggregateOutputType | null
    _max: MarginTierMaxAggregateOutputType | null
  }

  export type MarginTierAvgAggregateOutputType = {
    id: number | null
    min: number | null
    max: number | null
    pct: number | null
  }

  export type MarginTierSumAggregateOutputType = {
    id: number | null
    min: number | null
    max: number | null
    pct: number | null
  }

  export type MarginTierMinAggregateOutputType = {
    id: number | null
    min: number | null
    max: number | null
    pct: number | null
  }

  export type MarginTierMaxAggregateOutputType = {
    id: number | null
    min: number | null
    max: number | null
    pct: number | null
  }

  export type MarginTierCountAggregateOutputType = {
    id: number
    min: number
    max: number
    pct: number
    _all: number
  }


  export type MarginTierAvgAggregateInputType = {
    id?: true
    min?: true
    max?: true
    pct?: true
  }

  export type MarginTierSumAggregateInputType = {
    id?: true
    min?: true
    max?: true
    pct?: true
  }

  export type MarginTierMinAggregateInputType = {
    id?: true
    min?: true
    max?: true
    pct?: true
  }

  export type MarginTierMaxAggregateInputType = {
    id?: true
    min?: true
    max?: true
    pct?: true
  }

  export type MarginTierCountAggregateInputType = {
    id?: true
    min?: true
    max?: true
    pct?: true
    _all?: true
  }

  export type MarginTierAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MarginTier to aggregate.
     */
    where?: MarginTierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarginTiers to fetch.
     */
    orderBy?: MarginTierOrderByWithRelationInput | MarginTierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MarginTierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarginTiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarginTiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MarginTiers
    **/
    _count?: true | MarginTierCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MarginTierAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MarginTierSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MarginTierMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MarginTierMaxAggregateInputType
  }

  export type GetMarginTierAggregateType<T extends MarginTierAggregateArgs> = {
        [P in keyof T & keyof AggregateMarginTier]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMarginTier[P]>
      : GetScalarType<T[P], AggregateMarginTier[P]>
  }




  export type MarginTierGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MarginTierWhereInput
    orderBy?: MarginTierOrderByWithAggregationInput | MarginTierOrderByWithAggregationInput[]
    by: MarginTierScalarFieldEnum[] | MarginTierScalarFieldEnum
    having?: MarginTierScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MarginTierCountAggregateInputType | true
    _avg?: MarginTierAvgAggregateInputType
    _sum?: MarginTierSumAggregateInputType
    _min?: MarginTierMinAggregateInputType
    _max?: MarginTierMaxAggregateInputType
  }

  export type MarginTierGroupByOutputType = {
    id: number
    min: number
    max: number | null
    pct: number
    _count: MarginTierCountAggregateOutputType | null
    _avg: MarginTierAvgAggregateOutputType | null
    _sum: MarginTierSumAggregateOutputType | null
    _min: MarginTierMinAggregateOutputType | null
    _max: MarginTierMaxAggregateOutputType | null
  }

  type GetMarginTierGroupByPayload<T extends MarginTierGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MarginTierGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MarginTierGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MarginTierGroupByOutputType[P]>
            : GetScalarType<T[P], MarginTierGroupByOutputType[P]>
        }
      >
    >


  export type MarginTierSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    min?: boolean
    max?: boolean
    pct?: boolean
  }, ExtArgs["result"]["marginTier"]>

  export type MarginTierSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    min?: boolean
    max?: boolean
    pct?: boolean
  }, ExtArgs["result"]["marginTier"]>

  export type MarginTierSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    min?: boolean
    max?: boolean
    pct?: boolean
  }, ExtArgs["result"]["marginTier"]>

  export type MarginTierSelectScalar = {
    id?: boolean
    min?: boolean
    max?: boolean
    pct?: boolean
  }

  export type MarginTierOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "min" | "max" | "pct", ExtArgs["result"]["marginTier"]>

  export type $MarginTierPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MarginTier"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      min: number
      max: number | null
      pct: number
    }, ExtArgs["result"]["marginTier"]>
    composites: {}
  }

  type MarginTierGetPayload<S extends boolean | null | undefined | MarginTierDefaultArgs> = $Result.GetResult<Prisma.$MarginTierPayload, S>

  type MarginTierCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MarginTierFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MarginTierCountAggregateInputType | true
    }

  export interface MarginTierDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MarginTier'], meta: { name: 'MarginTier' } }
    /**
     * Find zero or one MarginTier that matches the filter.
     * @param {MarginTierFindUniqueArgs} args - Arguments to find a MarginTier
     * @example
     * // Get one MarginTier
     * const marginTier = await prisma.marginTier.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MarginTierFindUniqueArgs>(args: SelectSubset<T, MarginTierFindUniqueArgs<ExtArgs>>): Prisma__MarginTierClient<$Result.GetResult<Prisma.$MarginTierPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MarginTier that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MarginTierFindUniqueOrThrowArgs} args - Arguments to find a MarginTier
     * @example
     * // Get one MarginTier
     * const marginTier = await prisma.marginTier.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MarginTierFindUniqueOrThrowArgs>(args: SelectSubset<T, MarginTierFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MarginTierClient<$Result.GetResult<Prisma.$MarginTierPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MarginTier that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarginTierFindFirstArgs} args - Arguments to find a MarginTier
     * @example
     * // Get one MarginTier
     * const marginTier = await prisma.marginTier.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MarginTierFindFirstArgs>(args?: SelectSubset<T, MarginTierFindFirstArgs<ExtArgs>>): Prisma__MarginTierClient<$Result.GetResult<Prisma.$MarginTierPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MarginTier that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarginTierFindFirstOrThrowArgs} args - Arguments to find a MarginTier
     * @example
     * // Get one MarginTier
     * const marginTier = await prisma.marginTier.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MarginTierFindFirstOrThrowArgs>(args?: SelectSubset<T, MarginTierFindFirstOrThrowArgs<ExtArgs>>): Prisma__MarginTierClient<$Result.GetResult<Prisma.$MarginTierPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MarginTiers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarginTierFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MarginTiers
     * const marginTiers = await prisma.marginTier.findMany()
     * 
     * // Get first 10 MarginTiers
     * const marginTiers = await prisma.marginTier.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const marginTierWithIdOnly = await prisma.marginTier.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MarginTierFindManyArgs>(args?: SelectSubset<T, MarginTierFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MarginTierPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MarginTier.
     * @param {MarginTierCreateArgs} args - Arguments to create a MarginTier.
     * @example
     * // Create one MarginTier
     * const MarginTier = await prisma.marginTier.create({
     *   data: {
     *     // ... data to create a MarginTier
     *   }
     * })
     * 
     */
    create<T extends MarginTierCreateArgs>(args: SelectSubset<T, MarginTierCreateArgs<ExtArgs>>): Prisma__MarginTierClient<$Result.GetResult<Prisma.$MarginTierPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MarginTiers.
     * @param {MarginTierCreateManyArgs} args - Arguments to create many MarginTiers.
     * @example
     * // Create many MarginTiers
     * const marginTier = await prisma.marginTier.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MarginTierCreateManyArgs>(args?: SelectSubset<T, MarginTierCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MarginTiers and returns the data saved in the database.
     * @param {MarginTierCreateManyAndReturnArgs} args - Arguments to create many MarginTiers.
     * @example
     * // Create many MarginTiers
     * const marginTier = await prisma.marginTier.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MarginTiers and only return the `id`
     * const marginTierWithIdOnly = await prisma.marginTier.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MarginTierCreateManyAndReturnArgs>(args?: SelectSubset<T, MarginTierCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MarginTierPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MarginTier.
     * @param {MarginTierDeleteArgs} args - Arguments to delete one MarginTier.
     * @example
     * // Delete one MarginTier
     * const MarginTier = await prisma.marginTier.delete({
     *   where: {
     *     // ... filter to delete one MarginTier
     *   }
     * })
     * 
     */
    delete<T extends MarginTierDeleteArgs>(args: SelectSubset<T, MarginTierDeleteArgs<ExtArgs>>): Prisma__MarginTierClient<$Result.GetResult<Prisma.$MarginTierPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MarginTier.
     * @param {MarginTierUpdateArgs} args - Arguments to update one MarginTier.
     * @example
     * // Update one MarginTier
     * const marginTier = await prisma.marginTier.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MarginTierUpdateArgs>(args: SelectSubset<T, MarginTierUpdateArgs<ExtArgs>>): Prisma__MarginTierClient<$Result.GetResult<Prisma.$MarginTierPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MarginTiers.
     * @param {MarginTierDeleteManyArgs} args - Arguments to filter MarginTiers to delete.
     * @example
     * // Delete a few MarginTiers
     * const { count } = await prisma.marginTier.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MarginTierDeleteManyArgs>(args?: SelectSubset<T, MarginTierDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MarginTiers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarginTierUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MarginTiers
     * const marginTier = await prisma.marginTier.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MarginTierUpdateManyArgs>(args: SelectSubset<T, MarginTierUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MarginTiers and returns the data updated in the database.
     * @param {MarginTierUpdateManyAndReturnArgs} args - Arguments to update many MarginTiers.
     * @example
     * // Update many MarginTiers
     * const marginTier = await prisma.marginTier.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MarginTiers and only return the `id`
     * const marginTierWithIdOnly = await prisma.marginTier.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MarginTierUpdateManyAndReturnArgs>(args: SelectSubset<T, MarginTierUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MarginTierPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MarginTier.
     * @param {MarginTierUpsertArgs} args - Arguments to update or create a MarginTier.
     * @example
     * // Update or create a MarginTier
     * const marginTier = await prisma.marginTier.upsert({
     *   create: {
     *     // ... data to create a MarginTier
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MarginTier we want to update
     *   }
     * })
     */
    upsert<T extends MarginTierUpsertArgs>(args: SelectSubset<T, MarginTierUpsertArgs<ExtArgs>>): Prisma__MarginTierClient<$Result.GetResult<Prisma.$MarginTierPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MarginTiers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarginTierCountArgs} args - Arguments to filter MarginTiers to count.
     * @example
     * // Count the number of MarginTiers
     * const count = await prisma.marginTier.count({
     *   where: {
     *     // ... the filter for the MarginTiers we want to count
     *   }
     * })
    **/
    count<T extends MarginTierCountArgs>(
      args?: Subset<T, MarginTierCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MarginTierCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MarginTier.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarginTierAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MarginTierAggregateArgs>(args: Subset<T, MarginTierAggregateArgs>): Prisma.PrismaPromise<GetMarginTierAggregateType<T>>

    /**
     * Group by MarginTier.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarginTierGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MarginTierGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MarginTierGroupByArgs['orderBy'] }
        : { orderBy?: MarginTierGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MarginTierGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMarginTierGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MarginTier model
   */
  readonly fields: MarginTierFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MarginTier.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MarginTierClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MarginTier model
   */
  interface MarginTierFieldRefs {
    readonly id: FieldRef<"MarginTier", 'Int'>
    readonly min: FieldRef<"MarginTier", 'Float'>
    readonly max: FieldRef<"MarginTier", 'Float'>
    readonly pct: FieldRef<"MarginTier", 'Float'>
  }
    

  // Custom InputTypes
  /**
   * MarginTier findUnique
   */
  export type MarginTierFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarginTier
     */
    select?: MarginTierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarginTier
     */
    omit?: MarginTierOmit<ExtArgs> | null
    /**
     * Filter, which MarginTier to fetch.
     */
    where: MarginTierWhereUniqueInput
  }

  /**
   * MarginTier findUniqueOrThrow
   */
  export type MarginTierFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarginTier
     */
    select?: MarginTierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarginTier
     */
    omit?: MarginTierOmit<ExtArgs> | null
    /**
     * Filter, which MarginTier to fetch.
     */
    where: MarginTierWhereUniqueInput
  }

  /**
   * MarginTier findFirst
   */
  export type MarginTierFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarginTier
     */
    select?: MarginTierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarginTier
     */
    omit?: MarginTierOmit<ExtArgs> | null
    /**
     * Filter, which MarginTier to fetch.
     */
    where?: MarginTierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarginTiers to fetch.
     */
    orderBy?: MarginTierOrderByWithRelationInput | MarginTierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MarginTiers.
     */
    cursor?: MarginTierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarginTiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarginTiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MarginTiers.
     */
    distinct?: MarginTierScalarFieldEnum | MarginTierScalarFieldEnum[]
  }

  /**
   * MarginTier findFirstOrThrow
   */
  export type MarginTierFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarginTier
     */
    select?: MarginTierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarginTier
     */
    omit?: MarginTierOmit<ExtArgs> | null
    /**
     * Filter, which MarginTier to fetch.
     */
    where?: MarginTierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarginTiers to fetch.
     */
    orderBy?: MarginTierOrderByWithRelationInput | MarginTierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MarginTiers.
     */
    cursor?: MarginTierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarginTiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarginTiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MarginTiers.
     */
    distinct?: MarginTierScalarFieldEnum | MarginTierScalarFieldEnum[]
  }

  /**
   * MarginTier findMany
   */
  export type MarginTierFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarginTier
     */
    select?: MarginTierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarginTier
     */
    omit?: MarginTierOmit<ExtArgs> | null
    /**
     * Filter, which MarginTiers to fetch.
     */
    where?: MarginTierWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarginTiers to fetch.
     */
    orderBy?: MarginTierOrderByWithRelationInput | MarginTierOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MarginTiers.
     */
    cursor?: MarginTierWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarginTiers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarginTiers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MarginTiers.
     */
    distinct?: MarginTierScalarFieldEnum | MarginTierScalarFieldEnum[]
  }

  /**
   * MarginTier create
   */
  export type MarginTierCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarginTier
     */
    select?: MarginTierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarginTier
     */
    omit?: MarginTierOmit<ExtArgs> | null
    /**
     * The data needed to create a MarginTier.
     */
    data: XOR<MarginTierCreateInput, MarginTierUncheckedCreateInput>
  }

  /**
   * MarginTier createMany
   */
  export type MarginTierCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MarginTiers.
     */
    data: MarginTierCreateManyInput | MarginTierCreateManyInput[]
  }

  /**
   * MarginTier createManyAndReturn
   */
  export type MarginTierCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarginTier
     */
    select?: MarginTierSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MarginTier
     */
    omit?: MarginTierOmit<ExtArgs> | null
    /**
     * The data used to create many MarginTiers.
     */
    data: MarginTierCreateManyInput | MarginTierCreateManyInput[]
  }

  /**
   * MarginTier update
   */
  export type MarginTierUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarginTier
     */
    select?: MarginTierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarginTier
     */
    omit?: MarginTierOmit<ExtArgs> | null
    /**
     * The data needed to update a MarginTier.
     */
    data: XOR<MarginTierUpdateInput, MarginTierUncheckedUpdateInput>
    /**
     * Choose, which MarginTier to update.
     */
    where: MarginTierWhereUniqueInput
  }

  /**
   * MarginTier updateMany
   */
  export type MarginTierUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MarginTiers.
     */
    data: XOR<MarginTierUpdateManyMutationInput, MarginTierUncheckedUpdateManyInput>
    /**
     * Filter which MarginTiers to update
     */
    where?: MarginTierWhereInput
    /**
     * Limit how many MarginTiers to update.
     */
    limit?: number
  }

  /**
   * MarginTier updateManyAndReturn
   */
  export type MarginTierUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarginTier
     */
    select?: MarginTierSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MarginTier
     */
    omit?: MarginTierOmit<ExtArgs> | null
    /**
     * The data used to update MarginTiers.
     */
    data: XOR<MarginTierUpdateManyMutationInput, MarginTierUncheckedUpdateManyInput>
    /**
     * Filter which MarginTiers to update
     */
    where?: MarginTierWhereInput
    /**
     * Limit how many MarginTiers to update.
     */
    limit?: number
  }

  /**
   * MarginTier upsert
   */
  export type MarginTierUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarginTier
     */
    select?: MarginTierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarginTier
     */
    omit?: MarginTierOmit<ExtArgs> | null
    /**
     * The filter to search for the MarginTier to update in case it exists.
     */
    where: MarginTierWhereUniqueInput
    /**
     * In case the MarginTier found by the `where` argument doesn't exist, create a new MarginTier with this data.
     */
    create: XOR<MarginTierCreateInput, MarginTierUncheckedCreateInput>
    /**
     * In case the MarginTier was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MarginTierUpdateInput, MarginTierUncheckedUpdateInput>
  }

  /**
   * MarginTier delete
   */
  export type MarginTierDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarginTier
     */
    select?: MarginTierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarginTier
     */
    omit?: MarginTierOmit<ExtArgs> | null
    /**
     * Filter which MarginTier to delete.
     */
    where: MarginTierWhereUniqueInput
  }

  /**
   * MarginTier deleteMany
   */
  export type MarginTierDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MarginTiers to delete
     */
    where?: MarginTierWhereInput
    /**
     * Limit how many MarginTiers to delete.
     */
    limit?: number
  }

  /**
   * MarginTier without action
   */
  export type MarginTierDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarginTier
     */
    select?: MarginTierSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarginTier
     */
    omit?: MarginTierOmit<ExtArgs> | null
  }


  /**
   * Model Order
   */

  export type AggregateOrder = {
    _count: OrderCountAggregateOutputType | null
    _min: OrderMinAggregateOutputType | null
    _max: OrderMaxAggregateOutputType | null
  }

  export type OrderMinAggregateOutputType = {
    id: string | null
    orderNum: string | null
    customerEmail: string | null
    customerName: string | null
    createdAt: Date | null
    status: string | null
  }

  export type OrderMaxAggregateOutputType = {
    id: string | null
    orderNum: string | null
    customerEmail: string | null
    customerName: string | null
    createdAt: Date | null
    status: string | null
  }

  export type OrderCountAggregateOutputType = {
    id: number
    orderNum: number
    customerEmail: number
    customerName: number
    createdAt: number
    status: number
    _all: number
  }


  export type OrderMinAggregateInputType = {
    id?: true
    orderNum?: true
    customerEmail?: true
    customerName?: true
    createdAt?: true
    status?: true
  }

  export type OrderMaxAggregateInputType = {
    id?: true
    orderNum?: true
    customerEmail?: true
    customerName?: true
    createdAt?: true
    status?: true
  }

  export type OrderCountAggregateInputType = {
    id?: true
    orderNum?: true
    customerEmail?: true
    customerName?: true
    createdAt?: true
    status?: true
    _all?: true
  }

  export type OrderAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Order to aggregate.
     */
    where?: OrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Orders to fetch.
     */
    orderBy?: OrderOrderByWithRelationInput | OrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: OrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Orders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Orders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Orders
    **/
    _count?: true | OrderCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OrderMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OrderMaxAggregateInputType
  }

  export type GetOrderAggregateType<T extends OrderAggregateArgs> = {
        [P in keyof T & keyof AggregateOrder]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOrder[P]>
      : GetScalarType<T[P], AggregateOrder[P]>
  }




  export type OrderGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OrderWhereInput
    orderBy?: OrderOrderByWithAggregationInput | OrderOrderByWithAggregationInput[]
    by: OrderScalarFieldEnum[] | OrderScalarFieldEnum
    having?: OrderScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OrderCountAggregateInputType | true
    _min?: OrderMinAggregateInputType
    _max?: OrderMaxAggregateInputType
  }

  export type OrderGroupByOutputType = {
    id: string
    orderNum: string | null
    customerEmail: string | null
    customerName: string | null
    createdAt: Date
    status: string | null
    _count: OrderCountAggregateOutputType | null
    _min: OrderMinAggregateOutputType | null
    _max: OrderMaxAggregateOutputType | null
  }

  type GetOrderGroupByPayload<T extends OrderGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OrderGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OrderGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OrderGroupByOutputType[P]>
            : GetScalarType<T[P], OrderGroupByOutputType[P]>
        }
      >
    >


  export type OrderSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    orderNum?: boolean
    customerEmail?: boolean
    customerName?: boolean
    createdAt?: boolean
    status?: boolean
  }, ExtArgs["result"]["order"]>

  export type OrderSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    orderNum?: boolean
    customerEmail?: boolean
    customerName?: boolean
    createdAt?: boolean
    status?: boolean
  }, ExtArgs["result"]["order"]>

  export type OrderSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    orderNum?: boolean
    customerEmail?: boolean
    customerName?: boolean
    createdAt?: boolean
    status?: boolean
  }, ExtArgs["result"]["order"]>

  export type OrderSelectScalar = {
    id?: boolean
    orderNum?: boolean
    customerEmail?: boolean
    customerName?: boolean
    createdAt?: boolean
    status?: boolean
  }

  export type OrderOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "orderNum" | "customerEmail" | "customerName" | "createdAt" | "status", ExtArgs["result"]["order"]>

  export type $OrderPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Order"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      orderNum: string | null
      customerEmail: string | null
      customerName: string | null
      createdAt: Date
      status: string | null
    }, ExtArgs["result"]["order"]>
    composites: {}
  }

  type OrderGetPayload<S extends boolean | null | undefined | OrderDefaultArgs> = $Result.GetResult<Prisma.$OrderPayload, S>

  type OrderCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<OrderFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: OrderCountAggregateInputType | true
    }

  export interface OrderDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Order'], meta: { name: 'Order' } }
    /**
     * Find zero or one Order that matches the filter.
     * @param {OrderFindUniqueArgs} args - Arguments to find a Order
     * @example
     * // Get one Order
     * const order = await prisma.order.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OrderFindUniqueArgs>(args: SelectSubset<T, OrderFindUniqueArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Order that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {OrderFindUniqueOrThrowArgs} args - Arguments to find a Order
     * @example
     * // Get one Order
     * const order = await prisma.order.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OrderFindUniqueOrThrowArgs>(args: SelectSubset<T, OrderFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Order that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderFindFirstArgs} args - Arguments to find a Order
     * @example
     * // Get one Order
     * const order = await prisma.order.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OrderFindFirstArgs>(args?: SelectSubset<T, OrderFindFirstArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Order that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderFindFirstOrThrowArgs} args - Arguments to find a Order
     * @example
     * // Get one Order
     * const order = await prisma.order.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OrderFindFirstOrThrowArgs>(args?: SelectSubset<T, OrderFindFirstOrThrowArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Orders that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Orders
     * const orders = await prisma.order.findMany()
     * 
     * // Get first 10 Orders
     * const orders = await prisma.order.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const orderWithIdOnly = await prisma.order.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends OrderFindManyArgs>(args?: SelectSubset<T, OrderFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Order.
     * @param {OrderCreateArgs} args - Arguments to create a Order.
     * @example
     * // Create one Order
     * const Order = await prisma.order.create({
     *   data: {
     *     // ... data to create a Order
     *   }
     * })
     * 
     */
    create<T extends OrderCreateArgs>(args: SelectSubset<T, OrderCreateArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Orders.
     * @param {OrderCreateManyArgs} args - Arguments to create many Orders.
     * @example
     * // Create many Orders
     * const order = await prisma.order.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends OrderCreateManyArgs>(args?: SelectSubset<T, OrderCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Orders and returns the data saved in the database.
     * @param {OrderCreateManyAndReturnArgs} args - Arguments to create many Orders.
     * @example
     * // Create many Orders
     * const order = await prisma.order.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Orders and only return the `id`
     * const orderWithIdOnly = await prisma.order.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends OrderCreateManyAndReturnArgs>(args?: SelectSubset<T, OrderCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Order.
     * @param {OrderDeleteArgs} args - Arguments to delete one Order.
     * @example
     * // Delete one Order
     * const Order = await prisma.order.delete({
     *   where: {
     *     // ... filter to delete one Order
     *   }
     * })
     * 
     */
    delete<T extends OrderDeleteArgs>(args: SelectSubset<T, OrderDeleteArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Order.
     * @param {OrderUpdateArgs} args - Arguments to update one Order.
     * @example
     * // Update one Order
     * const order = await prisma.order.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends OrderUpdateArgs>(args: SelectSubset<T, OrderUpdateArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Orders.
     * @param {OrderDeleteManyArgs} args - Arguments to filter Orders to delete.
     * @example
     * // Delete a few Orders
     * const { count } = await prisma.order.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends OrderDeleteManyArgs>(args?: SelectSubset<T, OrderDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Orders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Orders
     * const order = await prisma.order.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends OrderUpdateManyArgs>(args: SelectSubset<T, OrderUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Orders and returns the data updated in the database.
     * @param {OrderUpdateManyAndReturnArgs} args - Arguments to update many Orders.
     * @example
     * // Update many Orders
     * const order = await prisma.order.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Orders and only return the `id`
     * const orderWithIdOnly = await prisma.order.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends OrderUpdateManyAndReturnArgs>(args: SelectSubset<T, OrderUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Order.
     * @param {OrderUpsertArgs} args - Arguments to update or create a Order.
     * @example
     * // Update or create a Order
     * const order = await prisma.order.upsert({
     *   create: {
     *     // ... data to create a Order
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Order we want to update
     *   }
     * })
     */
    upsert<T extends OrderUpsertArgs>(args: SelectSubset<T, OrderUpsertArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Orders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderCountArgs} args - Arguments to filter Orders to count.
     * @example
     * // Count the number of Orders
     * const count = await prisma.order.count({
     *   where: {
     *     // ... the filter for the Orders we want to count
     *   }
     * })
    **/
    count<T extends OrderCountArgs>(
      args?: Subset<T, OrderCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OrderCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Order.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends OrderAggregateArgs>(args: Subset<T, OrderAggregateArgs>): Prisma.PrismaPromise<GetOrderAggregateType<T>>

    /**
     * Group by Order.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends OrderGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OrderGroupByArgs['orderBy'] }
        : { orderBy?: OrderGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, OrderGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOrderGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Order model
   */
  readonly fields: OrderFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Order.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OrderClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Order model
   */
  interface OrderFieldRefs {
    readonly id: FieldRef<"Order", 'String'>
    readonly orderNum: FieldRef<"Order", 'String'>
    readonly customerEmail: FieldRef<"Order", 'String'>
    readonly customerName: FieldRef<"Order", 'String'>
    readonly createdAt: FieldRef<"Order", 'DateTime'>
    readonly status: FieldRef<"Order", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Order findUnique
   */
  export type OrderFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Filter, which Order to fetch.
     */
    where: OrderWhereUniqueInput
  }

  /**
   * Order findUniqueOrThrow
   */
  export type OrderFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Filter, which Order to fetch.
     */
    where: OrderWhereUniqueInput
  }

  /**
   * Order findFirst
   */
  export type OrderFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Filter, which Order to fetch.
     */
    where?: OrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Orders to fetch.
     */
    orderBy?: OrderOrderByWithRelationInput | OrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Orders.
     */
    cursor?: OrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Orders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Orders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Orders.
     */
    distinct?: OrderScalarFieldEnum | OrderScalarFieldEnum[]
  }

  /**
   * Order findFirstOrThrow
   */
  export type OrderFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Filter, which Order to fetch.
     */
    where?: OrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Orders to fetch.
     */
    orderBy?: OrderOrderByWithRelationInput | OrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Orders.
     */
    cursor?: OrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Orders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Orders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Orders.
     */
    distinct?: OrderScalarFieldEnum | OrderScalarFieldEnum[]
  }

  /**
   * Order findMany
   */
  export type OrderFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Filter, which Orders to fetch.
     */
    where?: OrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Orders to fetch.
     */
    orderBy?: OrderOrderByWithRelationInput | OrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Orders.
     */
    cursor?: OrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Orders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Orders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Orders.
     */
    distinct?: OrderScalarFieldEnum | OrderScalarFieldEnum[]
  }

  /**
   * Order create
   */
  export type OrderCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * The data needed to create a Order.
     */
    data: XOR<OrderCreateInput, OrderUncheckedCreateInput>
  }

  /**
   * Order createMany
   */
  export type OrderCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Orders.
     */
    data: OrderCreateManyInput | OrderCreateManyInput[]
  }

  /**
   * Order createManyAndReturn
   */
  export type OrderCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * The data used to create many Orders.
     */
    data: OrderCreateManyInput | OrderCreateManyInput[]
  }

  /**
   * Order update
   */
  export type OrderUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * The data needed to update a Order.
     */
    data: XOR<OrderUpdateInput, OrderUncheckedUpdateInput>
    /**
     * Choose, which Order to update.
     */
    where: OrderWhereUniqueInput
  }

  /**
   * Order updateMany
   */
  export type OrderUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Orders.
     */
    data: XOR<OrderUpdateManyMutationInput, OrderUncheckedUpdateManyInput>
    /**
     * Filter which Orders to update
     */
    where?: OrderWhereInput
    /**
     * Limit how many Orders to update.
     */
    limit?: number
  }

  /**
   * Order updateManyAndReturn
   */
  export type OrderUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * The data used to update Orders.
     */
    data: XOR<OrderUpdateManyMutationInput, OrderUncheckedUpdateManyInput>
    /**
     * Filter which Orders to update
     */
    where?: OrderWhereInput
    /**
     * Limit how many Orders to update.
     */
    limit?: number
  }

  /**
   * Order upsert
   */
  export type OrderUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * The filter to search for the Order to update in case it exists.
     */
    where: OrderWhereUniqueInput
    /**
     * In case the Order found by the `where` argument doesn't exist, create a new Order with this data.
     */
    create: XOR<OrderCreateInput, OrderUncheckedCreateInput>
    /**
     * In case the Order was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OrderUpdateInput, OrderUncheckedUpdateInput>
  }

  /**
   * Order delete
   */
  export type OrderDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Filter which Order to delete.
     */
    where: OrderWhereUniqueInput
  }

  /**
   * Order deleteMany
   */
  export type OrderDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Orders to delete
     */
    where?: OrderWhereInput
    /**
     * Limit how many Orders to delete.
     */
    limit?: number
  }

  /**
   * Order without action
   */
  export type OrderDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const StoreSettingScalarFieldEnum: {
    key: 'key',
    value: 'value'
  };

  export type StoreSettingScalarFieldEnum = (typeof StoreSettingScalarFieldEnum)[keyof typeof StoreSettingScalarFieldEnum]


  export const MarginTierScalarFieldEnum: {
    id: 'id',
    min: 'min',
    max: 'max',
    pct: 'pct'
  };

  export type MarginTierScalarFieldEnum = (typeof MarginTierScalarFieldEnum)[keyof typeof MarginTierScalarFieldEnum]


  export const OrderScalarFieldEnum: {
    id: 'id',
    orderNum: 'orderNum',
    customerEmail: 'customerEmail',
    customerName: 'customerName',
    createdAt: 'createdAt',
    status: 'status'
  };

  export type OrderScalarFieldEnum = (typeof OrderScalarFieldEnum)[keyof typeof OrderScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    
  /**
   * Deep Input Types
   */


  export type StoreSettingWhereInput = {
    AND?: StoreSettingWhereInput | StoreSettingWhereInput[]
    OR?: StoreSettingWhereInput[]
    NOT?: StoreSettingWhereInput | StoreSettingWhereInput[]
    key?: StringFilter<"StoreSetting"> | string
    value?: StringFilter<"StoreSetting"> | string
  }

  export type StoreSettingOrderByWithRelationInput = {
    key?: SortOrder
    value?: SortOrder
  }

  export type StoreSettingWhereUniqueInput = Prisma.AtLeast<{
    key?: string
    AND?: StoreSettingWhereInput | StoreSettingWhereInput[]
    OR?: StoreSettingWhereInput[]
    NOT?: StoreSettingWhereInput | StoreSettingWhereInput[]
    value?: StringFilter<"StoreSetting"> | string
  }, "key">

  export type StoreSettingOrderByWithAggregationInput = {
    key?: SortOrder
    value?: SortOrder
    _count?: StoreSettingCountOrderByAggregateInput
    _max?: StoreSettingMaxOrderByAggregateInput
    _min?: StoreSettingMinOrderByAggregateInput
  }

  export type StoreSettingScalarWhereWithAggregatesInput = {
    AND?: StoreSettingScalarWhereWithAggregatesInput | StoreSettingScalarWhereWithAggregatesInput[]
    OR?: StoreSettingScalarWhereWithAggregatesInput[]
    NOT?: StoreSettingScalarWhereWithAggregatesInput | StoreSettingScalarWhereWithAggregatesInput[]
    key?: StringWithAggregatesFilter<"StoreSetting"> | string
    value?: StringWithAggregatesFilter<"StoreSetting"> | string
  }

  export type MarginTierWhereInput = {
    AND?: MarginTierWhereInput | MarginTierWhereInput[]
    OR?: MarginTierWhereInput[]
    NOT?: MarginTierWhereInput | MarginTierWhereInput[]
    id?: IntFilter<"MarginTier"> | number
    min?: FloatFilter<"MarginTier"> | number
    max?: FloatNullableFilter<"MarginTier"> | number | null
    pct?: FloatFilter<"MarginTier"> | number
  }

  export type MarginTierOrderByWithRelationInput = {
    id?: SortOrder
    min?: SortOrder
    max?: SortOrderInput | SortOrder
    pct?: SortOrder
  }

  export type MarginTierWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: MarginTierWhereInput | MarginTierWhereInput[]
    OR?: MarginTierWhereInput[]
    NOT?: MarginTierWhereInput | MarginTierWhereInput[]
    min?: FloatFilter<"MarginTier"> | number
    max?: FloatNullableFilter<"MarginTier"> | number | null
    pct?: FloatFilter<"MarginTier"> | number
  }, "id">

  export type MarginTierOrderByWithAggregationInput = {
    id?: SortOrder
    min?: SortOrder
    max?: SortOrderInput | SortOrder
    pct?: SortOrder
    _count?: MarginTierCountOrderByAggregateInput
    _avg?: MarginTierAvgOrderByAggregateInput
    _max?: MarginTierMaxOrderByAggregateInput
    _min?: MarginTierMinOrderByAggregateInput
    _sum?: MarginTierSumOrderByAggregateInput
  }

  export type MarginTierScalarWhereWithAggregatesInput = {
    AND?: MarginTierScalarWhereWithAggregatesInput | MarginTierScalarWhereWithAggregatesInput[]
    OR?: MarginTierScalarWhereWithAggregatesInput[]
    NOT?: MarginTierScalarWhereWithAggregatesInput | MarginTierScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"MarginTier"> | number
    min?: FloatWithAggregatesFilter<"MarginTier"> | number
    max?: FloatNullableWithAggregatesFilter<"MarginTier"> | number | null
    pct?: FloatWithAggregatesFilter<"MarginTier"> | number
  }

  export type OrderWhereInput = {
    AND?: OrderWhereInput | OrderWhereInput[]
    OR?: OrderWhereInput[]
    NOT?: OrderWhereInput | OrderWhereInput[]
    id?: StringFilter<"Order"> | string
    orderNum?: StringNullableFilter<"Order"> | string | null
    customerEmail?: StringNullableFilter<"Order"> | string | null
    customerName?: StringNullableFilter<"Order"> | string | null
    createdAt?: DateTimeFilter<"Order"> | Date | string
    status?: StringNullableFilter<"Order"> | string | null
  }

  export type OrderOrderByWithRelationInput = {
    id?: SortOrder
    orderNum?: SortOrderInput | SortOrder
    customerEmail?: SortOrderInput | SortOrder
    customerName?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    status?: SortOrderInput | SortOrder
  }

  export type OrderWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: OrderWhereInput | OrderWhereInput[]
    OR?: OrderWhereInput[]
    NOT?: OrderWhereInput | OrderWhereInput[]
    orderNum?: StringNullableFilter<"Order"> | string | null
    customerEmail?: StringNullableFilter<"Order"> | string | null
    customerName?: StringNullableFilter<"Order"> | string | null
    createdAt?: DateTimeFilter<"Order"> | Date | string
    status?: StringNullableFilter<"Order"> | string | null
  }, "id">

  export type OrderOrderByWithAggregationInput = {
    id?: SortOrder
    orderNum?: SortOrderInput | SortOrder
    customerEmail?: SortOrderInput | SortOrder
    customerName?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    status?: SortOrderInput | SortOrder
    _count?: OrderCountOrderByAggregateInput
    _max?: OrderMaxOrderByAggregateInput
    _min?: OrderMinOrderByAggregateInput
  }

  export type OrderScalarWhereWithAggregatesInput = {
    AND?: OrderScalarWhereWithAggregatesInput | OrderScalarWhereWithAggregatesInput[]
    OR?: OrderScalarWhereWithAggregatesInput[]
    NOT?: OrderScalarWhereWithAggregatesInput | OrderScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Order"> | string
    orderNum?: StringNullableWithAggregatesFilter<"Order"> | string | null
    customerEmail?: StringNullableWithAggregatesFilter<"Order"> | string | null
    customerName?: StringNullableWithAggregatesFilter<"Order"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Order"> | Date | string
    status?: StringNullableWithAggregatesFilter<"Order"> | string | null
  }

  export type StoreSettingCreateInput = {
    key: string
    value: string
  }

  export type StoreSettingUncheckedCreateInput = {
    key: string
    value: string
  }

  export type StoreSettingUpdateInput = {
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
  }

  export type StoreSettingUncheckedUpdateInput = {
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
  }

  export type StoreSettingCreateManyInput = {
    key: string
    value: string
  }

  export type StoreSettingUpdateManyMutationInput = {
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
  }

  export type StoreSettingUncheckedUpdateManyInput = {
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
  }

  export type MarginTierCreateInput = {
    min: number
    max?: number | null
    pct: number
  }

  export type MarginTierUncheckedCreateInput = {
    id?: number
    min: number
    max?: number | null
    pct: number
  }

  export type MarginTierUpdateInput = {
    min?: FloatFieldUpdateOperationsInput | number
    max?: NullableFloatFieldUpdateOperationsInput | number | null
    pct?: FloatFieldUpdateOperationsInput | number
  }

  export type MarginTierUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    min?: FloatFieldUpdateOperationsInput | number
    max?: NullableFloatFieldUpdateOperationsInput | number | null
    pct?: FloatFieldUpdateOperationsInput | number
  }

  export type MarginTierCreateManyInput = {
    id?: number
    min: number
    max?: number | null
    pct: number
  }

  export type MarginTierUpdateManyMutationInput = {
    min?: FloatFieldUpdateOperationsInput | number
    max?: NullableFloatFieldUpdateOperationsInput | number | null
    pct?: FloatFieldUpdateOperationsInput | number
  }

  export type MarginTierUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    min?: FloatFieldUpdateOperationsInput | number
    max?: NullableFloatFieldUpdateOperationsInput | number | null
    pct?: FloatFieldUpdateOperationsInput | number
  }

  export type OrderCreateInput = {
    id: string
    orderNum?: string | null
    customerEmail?: string | null
    customerName?: string | null
    createdAt?: Date | string
    status?: string | null
  }

  export type OrderUncheckedCreateInput = {
    id: string
    orderNum?: string | null
    customerEmail?: string | null
    customerName?: string | null
    createdAt?: Date | string
    status?: string | null
  }

  export type OrderUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderNum?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    customerName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OrderUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderNum?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    customerName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OrderCreateManyInput = {
    id: string
    orderNum?: string | null
    customerEmail?: string | null
    customerName?: string | null
    createdAt?: Date | string
    status?: string | null
  }

  export type OrderUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderNum?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    customerName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OrderUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderNum?: NullableStringFieldUpdateOperationsInput | string | null
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    customerName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StoreSettingCountOrderByAggregateInput = {
    key?: SortOrder
    value?: SortOrder
  }

  export type StoreSettingMaxOrderByAggregateInput = {
    key?: SortOrder
    value?: SortOrder
  }

  export type StoreSettingMinOrderByAggregateInput = {
    key?: SortOrder
    value?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type MarginTierCountOrderByAggregateInput = {
    id?: SortOrder
    min?: SortOrder
    max?: SortOrder
    pct?: SortOrder
  }

  export type MarginTierAvgOrderByAggregateInput = {
    id?: SortOrder
    min?: SortOrder
    max?: SortOrder
    pct?: SortOrder
  }

  export type MarginTierMaxOrderByAggregateInput = {
    id?: SortOrder
    min?: SortOrder
    max?: SortOrder
    pct?: SortOrder
  }

  export type MarginTierMinOrderByAggregateInput = {
    id?: SortOrder
    min?: SortOrder
    max?: SortOrder
    pct?: SortOrder
  }

  export type MarginTierSumOrderByAggregateInput = {
    id?: SortOrder
    min?: SortOrder
    max?: SortOrder
    pct?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type OrderCountOrderByAggregateInput = {
    id?: SortOrder
    orderNum?: SortOrder
    customerEmail?: SortOrder
    customerName?: SortOrder
    createdAt?: SortOrder
    status?: SortOrder
  }

  export type OrderMaxOrderByAggregateInput = {
    id?: SortOrder
    orderNum?: SortOrder
    customerEmail?: SortOrder
    customerName?: SortOrder
    createdAt?: SortOrder
    status?: SortOrder
  }

  export type OrderMinOrderByAggregateInput = {
    id?: SortOrder
    orderNum?: SortOrder
    customerEmail?: SortOrder
    customerName?: SortOrder
    createdAt?: SortOrder
    status?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}