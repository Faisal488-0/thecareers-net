import test from 'node:test';
import assert from 'node:assert/strict';
import { eligible, render, schema, canonical, countryCode, plain } from '../scripts/generate-job-pages.mjs';
const now=Date.now();
function job(overrides={}){return {
 id:'42045f50-d32d-405b-bee1-934bc5a2eee2',title:'Operations Analyst',company:'Example Employer',
 description:'Coordinate daily operations and support the analysis team with detailed reporting and documentation. Ensure that operational plans stay current and work with colleagues to improve team processes for assigned responsibilities.',
 location:'Kuwait City, Kuwait',country:'Kuwait',url:'https://example.org/careers/1',
 status:'active',verified:true,quality_status:'approved',employment_type:'FULL_TIME',
 published_at:new Date(now-864e5).toISOString(),updated_at:new Date(now-3600e3).toISOString(),...overrides
};}
test('reject ambiguous and stale postings',()=>{
 assert.equal(eligible(job()),true);
 for(const change of [
 {status:'inactive'},{verified:false},{quality_status:'pending'},{description:'Brief'},
 {published_at:null},{published_at:new Date(now-121*864e5).toISOString()},
 {updated_at:new Date(now-46*864e5).toISOString()}, {url:'javascript:alert(1)'},{location:'Unknown',country:'International'}
 ])assert.equal(eligible(job(change)),false,JSON.stringify(change));
});
test('correct canonical and genuine optional Google fields',()=>{
 const j=job({employment_type:'UNAVAILABLE'}),s=schema(j);
 assert.equal(s['@type'],'JobPosting');
 assert.equal(s.hiringOrganization.name,j.company);
 assert.equal(s.description,plain(j.description));
 assert.equal(s.datePosted,j.published_at);
 assert.equal(s.employmentType,undefined);
 assert.equal(s.validThrough,undefined);
 assert.equal(s.jobLocation.address.addressCountry,'KW');
 assert.equal(countryCode({...j,country:'International',location:'Austin, TX, US'}),'US');
 assert.equal(canonical(j),'https://thecareers.net/jobs/'+j.id+'/');
});
test('complete description, metadata uniqueness, source attribution and safe JSON-LD',()=>{
 const j=job({title:'Support </script><script>alert(1)</script> Lead'});
 const html=render(j);
 assert.ok(html.includes('Ref 42045f50.'));
 assert.ok(html.includes(j.description));
 assert.ok(!html.includes('<script>alert(1)</script>'));
 assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
 const json=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(json);
 assert.equal(JSON.parse(json).jobLocation.address.addressCountry,'KW');
 assert.match(html,/View original vacancy and application instructions/);
});
