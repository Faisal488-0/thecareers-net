import test from 'node:test';
import assert from 'node:assert/strict';
import { _test as t } from '../scripts/job-seo-build.mjs';
const now=Date.now();
function fixture(o={}){return {
 id:'11111111-2222-4333-8444-555555555555',title:'HR Operations Specialist',company:'Example Co',
 description:'Manage core HR operations, maintain employee records, coordinate onboarding, and support payroll and administrative workflows for the local team. Partner with managers to keep processes accurate and timely.',
 location:'Kuwait City',country:'Kuwait',employment_type:'FULL_TIME',
 published_at:new Date(now-2*864e5).toISOString(),found_at:new Date(now-864e5).toISOString(),updated_at:new Date(now-3600e3).toISOString(),
 url:'https://example.com/jobs/123',verified:true,status:'active',quality_status:'approved',...o};}
test('only complete source-verified jobs get JobPosting pages',()=>{
 assert.equal(t.eligible(fixture()),true);
 for(const o of [{published_at:null},{verified:false},{status:'inactive'},{quality_status:'pending'},{description:'short'},{country:'International'},{url:'javascript:alert(1)'},{description:'A clipped source description...'}]) assert.equal(t.eligible(fixture(o)),false,JSON.stringify(o));
});
test('schema uses real fields and never fabricates validThrough',()=>{
 const s=t.schema(fixture());
 assert.equal(s['@type'],'JobPosting'); assert.equal(s.title,'HR Operations Specialist');
 assert.equal(s.jobLocation.address.addressCountry,'KW'); assert.equal(s.employmentType,'FULL_TIME');
 assert.equal(s.validThrough,undefined); assert.equal(t.canonical(fixture()),'https://thecareers.net/jobs/11111111-2222-4333-8444-555555555555/');
});
test('leaf page has one canonical, unique meta and visible full description',()=>{
 const j=fixture(); const h=t.render(j);
 assert.equal((h.match(/rel="canonical"/g)||[]).length,1);
 assert.equal((h.match(/application\/ld\+json/g)||[]).length,1);
 assert.ok(h.includes(t.plain(j.description)));
 assert.match(h,/Ref 11111111\./);
});
