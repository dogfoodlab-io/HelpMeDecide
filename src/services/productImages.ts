import type {SupabaseClient} from '@supabase/supabase-js';
export type ProductPhoto={url:string;sourceUrl:string};
export type ProductImageLoader=(candidateId:string,retry?:boolean,failedUrls?:string[])=>Promise<ProductPhoto[]>;
// Coalesce repeated renders/StrictMode requests. Keep the cache scoped to the
// signed-in client and decision; a different product identity gets a new key.
const requests=new WeakMap<SupabaseClient,Map<string,Promise<ProductPhoto[]>>>();
export function productImageLoader(client:SupabaseClient,decisionId:string,version:string):ProductImageLoader{
  let cache=requests.get(client);if(!cache){cache=new Map();requests.set(client,cache);}
  return(candidateId,retry=false,failedUrls=[])=>{
    const key=`${decisionId}:${candidateId}:${version}`;if(retry)cache!.delete(key);
    let request=cache!.get(key);if(!request){request=(async()=>{const {data,error}=await client.functions.invoke('product-api',{body:{operation:'image',decisionId,candidateId,failedUrls:failedUrls.slice(-6)}});if(error)throw new Error('Could not load product photos');return data.images as ProductPhoto[];})();cache!.set(key,request);request.catch(()=>cache!.delete(key));}
    return request;
  };
}
