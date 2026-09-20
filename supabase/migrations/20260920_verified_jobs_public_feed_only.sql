drop policy if exists public_read_jobs on public.jobs;
create policy public_read_jobs on public.jobs
for select to anon, authenticated
using (status='active' and verified is true);

create or replace function public.search_jobs_by_role_v2(
  p_query text default '',
  p_limit integer default 500,
  p_country text default 'all',
  p_filter text default 'all',
  p_sector text default '',
  p_sort text default 'relevance'
)
returns table(
  id uuid,title text,company text,location text,country text,effective_country text,
  employment_type text,category text,salary_min numeric,salary_max numeric,currency text,
  score integer,verified boolean,published_at timestamptz,found_at timestamptz,url text,
  source_name text,search_rank integer,sector text
)
language sql stable
set search_path to 'public','pg_catalog'
as $function$
  with ranked as (
    select j.id,j.title,j.company,j.location,j.country,
      public.tc_effective_country(j.location,j.country,j.source_name) as effective_country,
      j.employment_type,j.category,nullif(j.salary_min,0) as salary_min,
      nullif(j.salary_max,0) as salary_max,nullif(trim(j.currency),'') as currency,
      j.score,j.verified,j.published_at,j.found_at,j.url,j.source_name,
      public.tc_role_semantic_score(j.title,j.category,p_query) as search_rank,
      public.tc_job_sector(j.title,j.category) as sector
    from public.jobs j
    where j.status='active' and j.verified is true and j.url is not null
  )
  select r.* from ranked r
  where
    (coalesce(trim(p_query),'')='' or r.search_rank>0)
    and (
      coalesce(lower(trim(p_country)),'all') in ('','all')
      or (lower(trim(p_country))='gcc' and r.effective_country in ('Kuwait','UAE','Saudi Arabia','Qatar','Oman','Bahrain','GCC'))
      or (lower(trim(p_country))='kuwait' and r.effective_country='Kuwait')
      or (lower(trim(p_country))='uae' and r.effective_country='UAE')
      or (lower(trim(p_country))='saudi' and r.effective_country='Saudi Arabia')
      or (lower(trim(p_country))='qatar' and r.effective_country='Qatar')
      or (lower(trim(p_country))='oman' and r.effective_country='Oman')
      or (lower(trim(p_country))='bahrain' and r.effective_country='Bahrain')
    )
    and (
      coalesce(lower(trim(p_filter)),'all') in ('','all','verified')
      or (lower(trim(p_filter))='priority' and coalesce(r.score,0)>=50)
      or (lower(trim(p_filter))='salary' and (r.salary_min is not null or r.salary_max is not null))
    )
    and (coalesce(trim(p_sector),'')='' or r.sector=p_sector)
  order by
    case when lower(coalesce(p_sort,'relevance'))='company' then lower(coalesce(r.company,'')) end asc nulls last,
    case when lower(coalesce(p_sort,'relevance'))='newest' then coalesce(r.published_at,r.found_at) end desc nulls last,
    case when lower(coalesce(p_sort,'relevance'))='relevance' and coalesce(trim(p_query),'')<>'' then r.search_rank end desc nulls last,
    case when lower(coalesce(p_sort,'relevance'))='relevance' then coalesce(r.score,0) end desc,
    coalesce(r.published_at,r.found_at) desc nulls last
  limit greatest(1,least(coalesce(p_limit,500),1000));
$function$;