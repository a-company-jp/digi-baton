/**
 * Generated by orval v7.6.0 🍺
 * Do not edit manually.
 * Digi Baton API
 * OpenAPI spec version: 2.0
 */
import {
  useMutation,
  useQuery
} from '@tanstack/react-query';
import type {
  DataTag,
  DefinedInitialDataOptions,
  DefinedUseQueryResult,
  MutationFunction,
  QueryFunction,
  QueryKey,
  UndefinedInitialDataOptions,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult
} from '@tanstack/react-query';

import type {
  HandlersDisclosureCreateRequest,
  HandlersDisclosureDeleteRequest,
  HandlersDisclosureResponse,
  HandlersDisclosureUpdateRequest,
  HandlersErrorResponse
} from '.././schemas';

import deleteDisclosuresMutator from '../../../../lib/fetch';
import getDisclosuresMutator from '../../../../lib/fetch';
import postDisclosuresMutator from '../../../../lib/fetch';
import putDisclosuresMutator from '../../../../lib/fetch';


type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];



/**
 * 開示申請を削除する
 * @summary 開示申請削除
 */
export type deleteDisclosuresResponse200 = {
  data: HandlersDisclosureResponse
  status: 200
}

export type deleteDisclosuresResponse400 = {
  data: HandlersErrorResponse
  status: 400
}
    
export type deleteDisclosuresResponseComposite = deleteDisclosuresResponse200 | deleteDisclosuresResponse400;
    
export type deleteDisclosuresResponse = deleteDisclosuresResponseComposite & {
  headers: Headers;
}

export const getDeleteDisclosuresUrl = () => {


  

  return `/disclosures`
}

export const deleteDisclosures = async (handlersDisclosureDeleteRequest: HandlersDisclosureDeleteRequest, options?: RequestInit): Promise<deleteDisclosuresResponse> => {
  
  return deleteDisclosuresMutator<deleteDisclosuresResponse>(getDeleteDisclosuresUrl(),
  {      
    ...options,
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(
      handlersDisclosureDeleteRequest,)
  }
);}




export const getDeleteDisclosuresMutationOptions = <TError = HandlersErrorResponse,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteDisclosures>>, TError,{data: HandlersDisclosureDeleteRequest}, TContext>, request?: SecondParameter<typeof deleteDisclosuresMutator>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteDisclosures>>, TError,{data: HandlersDisclosureDeleteRequest}, TContext> => {
    
const mutationKey = ['deleteDisclosures'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};

      


      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteDisclosures>>, {data: HandlersDisclosureDeleteRequest}> = (props) => {
          const {data} = props ?? {};

          return  deleteDisclosures(data,requestOptions)
        }

        


  return  { mutationFn, ...mutationOptions }}

    export type DeleteDisclosuresMutationResult = NonNullable<Awaited<ReturnType<typeof deleteDisclosures>>>
    export type DeleteDisclosuresMutationBody = HandlersDisclosureDeleteRequest
    export type DeleteDisclosuresMutationError = HandlersErrorResponse

    /**
 * @summary 開示申請削除
 */
export const useDeleteDisclosures = <TError = HandlersErrorResponse,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteDisclosures>>, TError,{data: HandlersDisclosureDeleteRequest}, TContext>, request?: SecondParameter<typeof deleteDisclosuresMutator>}
): UseMutationResult<
        Awaited<ReturnType<typeof deleteDisclosures>>,
        TError,
        {data: HandlersDisclosureDeleteRequest},
        TContext
      > => {

      const mutationOptions = getDeleteDisclosuresMutationOptions(options);

      return useMutation(mutationOptions);
    }
    /**
 * ユーザが受けた開示請求一覧を取得する
 * @summary 開示申請一覧取得
 */
export type getDisclosuresResponse200 = {
  data: HandlersDisclosureResponse[]
  status: 200
}

export type getDisclosuresResponse400 = {
  data: HandlersErrorResponse
  status: 400
}
    
export type getDisclosuresResponseComposite = getDisclosuresResponse200 | getDisclosuresResponse400;
    
export type getDisclosuresResponse = getDisclosuresResponseComposite & {
  headers: Headers;
}

export const getGetDisclosuresUrl = () => {


  

  return `/disclosures`
}

export const getDisclosures = async ( options?: RequestInit): Promise<getDisclosuresResponse> => {
  
  return getDisclosuresMutator<getDisclosuresResponse>(getGetDisclosuresUrl(),
  {      
    ...options,
    method: 'GET'
    
    
  }
);}



export const getGetDisclosuresQueryKey = () => {
    return [`/disclosures`] as const;
    }

    
export const getGetDisclosuresQueryOptions = <TData = Awaited<ReturnType<typeof getDisclosures>>, TError = HandlersErrorResponse>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getDisclosures>>, TError, TData>>, request?: SecondParameter<typeof getDisclosuresMutator>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetDisclosuresQueryKey();

  

    const queryFn: QueryFunction<Awaited<ReturnType<typeof getDisclosures>>> = ({ signal }) => getDisclosures({ signal, ...requestOptions });

      

      

   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getDisclosures>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetDisclosuresQueryResult = NonNullable<Awaited<ReturnType<typeof getDisclosures>>>
export type GetDisclosuresQueryError = HandlersErrorResponse


export function useGetDisclosures<TData = Awaited<ReturnType<typeof getDisclosures>>, TError = HandlersErrorResponse>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getDisclosures>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getDisclosures>>,
          TError,
          Awaited<ReturnType<typeof getDisclosures>>
        > , 'initialData'
      >, request?: SecondParameter<typeof getDisclosuresMutator>}

  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetDisclosures<TData = Awaited<ReturnType<typeof getDisclosures>>, TError = HandlersErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getDisclosures>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getDisclosures>>,
          TError,
          Awaited<ReturnType<typeof getDisclosures>>
        > , 'initialData'
      >, request?: SecondParameter<typeof getDisclosuresMutator>}

  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetDisclosures<TData = Awaited<ReturnType<typeof getDisclosures>>, TError = HandlersErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getDisclosures>>, TError, TData>>, request?: SecondParameter<typeof getDisclosuresMutator>}

  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary 開示申請一覧取得
 */

export function useGetDisclosures<TData = Awaited<ReturnType<typeof getDisclosures>>, TError = HandlersErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getDisclosures>>, TError, TData>>, request?: SecondParameter<typeof getDisclosuresMutator>}

  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetDisclosuresQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  query.queryKey = queryOptions.queryKey ;

  return query;
}



/**
 * ユーザが他のユーザに開示請求を出す
 * @summary 開示申請作成
 */
export type postDisclosuresResponse200 = {
  data: HandlersDisclosureResponse
  status: 200
}

export type postDisclosuresResponse400 = {
  data: HandlersErrorResponse
  status: 400
}
    
export type postDisclosuresResponseComposite = postDisclosuresResponse200 | postDisclosuresResponse400;
    
export type postDisclosuresResponse = postDisclosuresResponseComposite & {
  headers: Headers;
}

export const getPostDisclosuresUrl = () => {


  

  return `/disclosures`
}

export const postDisclosures = async (handlersDisclosureCreateRequest: HandlersDisclosureCreateRequest, options?: RequestInit): Promise<postDisclosuresResponse> => {
  
  return postDisclosuresMutator<postDisclosuresResponse>(getPostDisclosuresUrl(),
  {      
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(
      handlersDisclosureCreateRequest,)
  }
);}




export const getPostDisclosuresMutationOptions = <TError = HandlersErrorResponse,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postDisclosures>>, TError,{data: HandlersDisclosureCreateRequest}, TContext>, request?: SecondParameter<typeof postDisclosuresMutator>}
): UseMutationOptions<Awaited<ReturnType<typeof postDisclosures>>, TError,{data: HandlersDisclosureCreateRequest}, TContext> => {
    
const mutationKey = ['postDisclosures'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};

      


      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postDisclosures>>, {data: HandlersDisclosureCreateRequest}> = (props) => {
          const {data} = props ?? {};

          return  postDisclosures(data,requestOptions)
        }

        


  return  { mutationFn, ...mutationOptions }}

    export type PostDisclosuresMutationResult = NonNullable<Awaited<ReturnType<typeof postDisclosures>>>
    export type PostDisclosuresMutationBody = HandlersDisclosureCreateRequest
    export type PostDisclosuresMutationError = HandlersErrorResponse

    /**
 * @summary 開示申請作成
 */
export const usePostDisclosures = <TError = HandlersErrorResponse,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postDisclosures>>, TError,{data: HandlersDisclosureCreateRequest}, TContext>, request?: SecondParameter<typeof postDisclosuresMutator>}
): UseMutationResult<
        Awaited<ReturnType<typeof postDisclosures>>,
        TError,
        {data: HandlersDisclosureCreateRequest},
        TContext
      > => {

      const mutationOptions = getPostDisclosuresMutationOptions(options);

      return useMutation(mutationOptions);
    }
    /**
 * 開示申請のステータスを更新する
 * @summary 開示申請更新
 */
export type putDisclosuresResponse200 = {
  data: HandlersDisclosureResponse
  status: 200
}

export type putDisclosuresResponse400 = {
  data: HandlersErrorResponse
  status: 400
}
    
export type putDisclosuresResponseComposite = putDisclosuresResponse200 | putDisclosuresResponse400;
    
export type putDisclosuresResponse = putDisclosuresResponseComposite & {
  headers: Headers;
}

export const getPutDisclosuresUrl = () => {


  

  return `/disclosures`
}

export const putDisclosures = async (handlersDisclosureUpdateRequest: HandlersDisclosureUpdateRequest, options?: RequestInit): Promise<putDisclosuresResponse> => {
  
  return putDisclosuresMutator<putDisclosuresResponse>(getPutDisclosuresUrl(),
  {      
    ...options,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(
      handlersDisclosureUpdateRequest,)
  }
);}




export const getPutDisclosuresMutationOptions = <TError = HandlersErrorResponse,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putDisclosures>>, TError,{data: HandlersDisclosureUpdateRequest}, TContext>, request?: SecondParameter<typeof putDisclosuresMutator>}
): UseMutationOptions<Awaited<ReturnType<typeof putDisclosures>>, TError,{data: HandlersDisclosureUpdateRequest}, TContext> => {
    
const mutationKey = ['putDisclosures'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};

      


      const mutationFn: MutationFunction<Awaited<ReturnType<typeof putDisclosures>>, {data: HandlersDisclosureUpdateRequest}> = (props) => {
          const {data} = props ?? {};

          return  putDisclosures(data,requestOptions)
        }

        


  return  { mutationFn, ...mutationOptions }}

    export type PutDisclosuresMutationResult = NonNullable<Awaited<ReturnType<typeof putDisclosures>>>
    export type PutDisclosuresMutationBody = HandlersDisclosureUpdateRequest
    export type PutDisclosuresMutationError = HandlersErrorResponse

    /**
 * @summary 開示申請更新
 */
export const usePutDisclosures = <TError = HandlersErrorResponse,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putDisclosures>>, TError,{data: HandlersDisclosureUpdateRequest}, TContext>, request?: SecondParameter<typeof putDisclosuresMutator>}
): UseMutationResult<
        Awaited<ReturnType<typeof putDisclosures>>,
        TError,
        {data: HandlersDisclosureUpdateRequest},
        TContext
      > => {

      const mutationOptions = getPutDisclosuresMutationOptions(options);

      return useMutation(mutationOptions);
    }
    