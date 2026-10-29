export function certification(item={}) {
  const candidates=[item.metadata,item,item.info,item.movie_data].filter(value=>value&&typeof value==='object');
  const br=item.content_ratings?.results?.find(row=>row.iso_3166_1==='BR');
  if(br)candidates.unshift({certification:br.rating,ageCountry:'BR'});
  const release=item.release_dates?.results?.find(row=>row.iso_3166_1==='BR')?.release_dates?.find(row=>row.certification);
  if(release)candidates.unshift({certification:release.certification,ageCountry:'BR'});
  for(const candidate of candidates)for(const key of ['age_rating','content_rating','certification','mpaa','parental_rating','classification','contentAdvisoryRating','rated','tv_rating','us_rating','age']) {
    const label=String(candidate[key]??'').trim().toUpperCase().replace(/^CLASSIFICAÇÃO\s*:?\s*/,'').replace(/^RATED\s+/,'').replace(/^USA?\s*:?\s*/,'');
    const match=/^(?:BR[- ]?|A)?\+?(L|LIVRE|0|6|10|12|14|16|18)(?:\s*(?:ANOS|\+))?$/.exec(label);
    if(match){const age=['L','LIVRE'].includes(match[1])?0:Number(match[1]);return {age,ageLabel:age===0?'L':String(age),ageCountry:candidate.ageCountry||'',ageSource:candidate.ageSource||'Provedor',...(candidate.ageSourceUrl?{ageSourceUrl:candidate.ageSourceUrl}:{})};}
    if(/^(TV-(?:Y|Y7|Y7-FV|G|PG|14|MA)|G|PG|PG-13|R|NC-17)$/.test(label)){
      const reference={'TV-Y':0,'TV-Y7':7,'TV-Y7-FV':7,'TV-G':0,'TV-PG':10,'TV-14':14,'TV-MA':18,G:0,PG:10,'PG-13':14,R:18,'NC-17':18};
      return {age:reference[label]??null,ageLabel:label,ageCountry:candidate.ageCountry||'US',ageSource:candidate.ageSource||'Provedor',ageReference:true};
    }
  }
  return {age:null,ageLabel:'Não informada',ageCountry:'',ageSource:''};
}
export function contentMetadata(item = {}, category = '') {
  const classification=certification(item),{age}=classification;
  const text = `${item.name || item.title || ''} ${category}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const adult = ['true','1'].includes(String(item.is_adult).toLowerCase()) || age === 18 || /(?:\+\s*18|18\s*\+|\b(?:adult[oa]s?|xxx|porn\w*|erotic\w*|sex\s*hot)\b)/i.test(text);
  return { ...classification, adult,
    description:String(item.plot || item.description || item.overview || '').replace(/<[^>]*>/g,'').slice(0,12000),
    genre:String(item.genre || ''), duration:String(item.duration || item.episode_run_time || ''), director:String(item.director || ''), cast:String(item.cast || item.actors || '') };
}
export function contentAllowed(metadata, policy) {
  if (policy.hideAdult && metadata.adult) return false;
  if (metadata.age === null) return !policy.blockUnknown;
  return policy.maxAge === null || metadata.age <= policy.maxAge;
}
