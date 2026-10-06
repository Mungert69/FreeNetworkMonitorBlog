const test=require('node:test');const assert=require('node:assert/strict');
const {articleSchema,serializeJsonLd}=require('../lib/utils/article-schema.cjs');
test('article metadata preserves source dates and canonical URL without inventing missing fields',()=>{
 const schema=articleSchema({title:'TLS guide',date:'2026-10-06T12:00:00+01:00',canonical:'https://example.com/posts/tls/',image:'/tls.png',author:'Mahadeva',siteName:'Blog',baseUrl:'https://example.com'});
 assert.equal(schema.datePublished,'2026-10-06T12:00:00+01:00');assert.equal(schema.dateModified,undefined);assert.deepEqual(schema.image,['https://example.com/tls.png']);assert.equal(schema.mainEntityOfPage['@id'],schema.url);
 const absent=articleSchema({title:'Guide',date:'invalid',image:'javascript:alert(1)',canonical:'https://example.com/posts/a/',baseUrl:'https://example.com'});assert.equal(absent.image,undefined);assert.equal(absent.datePublished,undefined);
});
test('JSON-LD safely escapes embedded script terminators',()=>{
 const payload={headline:'</script><script>alert(1)</script>'};const serialized=serializeJsonLd(payload);assert(!serialized.includes('<'));assert.deepEqual(JSON.parse(serialized),payload);
});
