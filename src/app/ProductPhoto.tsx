import {useEffect,useRef,useState} from 'react';
import type {ProductImageLoader,ProductPhoto as Photo} from '../services/productImages';
export function ProductPhoto({name,candidateId,initial,loader}:{name:string;candidateId:string;initial?:Photo|null;loader?:ProductImageLoader}){
  const [photo,setPhoto]=useState(initial??null),[loading,setLoading]=useState(!initial&&!!loader);
  const failed=useRef(new Set<string>()),alternatives=useRef<Photo[]>([]),requested=useRef(false),generation=useRef(0);
  async function load(retry=false,failures=[...failed.current]){
    if(!loader)return;requested.current=true;const run=generation.current;setLoading(true);
    try{const photos=await loader(candidateId,retry,failures);if(run!==generation.current)return;alternatives.current=photos;setPhoto(photos.find(p=>!failed.current.has(p.url))??null);}
    catch{if(run===generation.current)setPhoto(null);}
    finally{if(run===generation.current)setLoading(false);}
  }
  useEffect(()=>{generation.current++;failed.current.clear();alternatives.current=[];requested.current=false;setPhoto(initial??null);setLoading(!initial&&!!loader);if(!initial)void load();return()=>{generation.current++;};},[candidateId,initial?.url,loader]);
  function broken(){if(photo)failed.current.add(photo.url);const next=alternatives.current.find(p=>!failed.current.has(p.url));setPhoto(next??null);if(!next&&!requested.current)void load();}
  return <div className="product-photo">{photo?<a href={photo.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Photo source for ${name}`}><img src={photo.url} alt={name} loading="lazy" referrerPolicy="no-referrer" onError={broken}/></a>:<div className="product-image-placeholder" role="status">{loading?<><span className="photo-loading" aria-hidden="true"/><small>Finding product photo…</small></>:<><small>Photo couldn’t be loaded</small>{loader&&<button type="button" onClick={()=>{const failures=[...failed.current];failed.current.clear();void load(true,failures);}}>Retry photo</button>}</>}</div>}</div>;
}
